import { HttpException, Injectable, Logger } from "@nestjs/common"
import { Restaurant, User, UserRole } from "@prisma/client"
import { Action, Command, Ctx, Help, On, Start, Update } from "nestjs-telegraf"
import { BotInstancesService } from "src/bot-instances/bot-instances.service"
import { UpdateRestaurantDto } from "src/restaurants/dto/update-restaurant.dto"
import { RestaurantsService } from "src/restaurants/restaurants.service"
import { Context } from "telegraf"
import { Message } from "telegraf/typings/core/types/typegram"
import { UsersService } from "../users/users.service"
import { AdminBotKeyboardsService } from "./keyboards/admin-bot.keyboards.service"
import {
	CallbackQueryContext,
	MyContext,
	UserState,
} from "./types/admin-bot.types"

@Update()
@Injectable()
export class AdminBotService {
	private readonly logger = new Logger(AdminBotService.name)

	private userStates = new Map<number, UserState>()

	constructor(
		private readonly usersService: UsersService,
		private readonly restaurantsService: RestaurantsService,
		private readonly keyboardsService: AdminBotKeyboardsService,
		private readonly botInstancesService: BotInstancesService
	) {}

	private async isAdmin(telegramUserId: number): Promise<boolean> {
		const user = await this.usersService.findOneByTelegramUserId(
			telegramUserId.toString()
		)

		return user?.role === UserRole.ADMIN
	}

	private getRestaurantViewMessage(
		restaurant: Restaurant & { owners: User[] }
	): string {
		const ownersText =
			restaurant.owners.length > 0
				? restaurant.owners
						.map(o => this.escapeMarkdown(o.username || o.telegramUserId))
						.join(", ")
				: "не назначен"

		return (
			`*Управление рестораном: ${this.escapeMarkdown(restaurant.name)}*\n` +
			`ID: \`${restaurant.id}\`\n` +
			`Статус: ${restaurant.isActive ? "Активен" : "Неактивен"}\n` +
			`Email: ${this.escapeMarkdown(restaurant.contactEmail || "не указан")}\n` +
			`Телефон: ${this.escapeMarkdown(restaurant.contactPhone || "не указан")}\n` +
			`Владелец: \`${ownersText}\``
		)
	}

	private getUserViewMessage(
		user: User & { restaurant: Restaurant | null }
	): string {
		const restaurantName = user.restaurant
			? this.escapeMarkdown(user.restaurant.name)
			: "не назначен"

		return (
			`*Карточка пользователя: ${this.escapeMarkdown(
				user.username || user.telegramUserId
			)}*\n` +
			`ID: \`${user.id}\`\n` +
			`Telegram ID: \`${user.telegramUserId}\`\n` +
			`Роль: \`${user.role}\`\n` +
			`Статус: ${user.isActive ? "Активен" : "Неактивен"}\n` +
			`Ресторан: \`${restaurantName}\``
		)
	}

	@Start()
	@Help()
	async onStart(@Ctx() ctx: Context) {
		if (!ctx.from) return

		if (await this.isAdmin(ctx.from.id)) {
			await ctx.reply(
				"Добро пожаловать, Администратор! Выберите действие:",
				this.keyboardsService.getMainMenu()
			)
		} else {
			await ctx.reply(
				"Здравствуйте! Этот бот предназначен для администрирования платформы. Доступ запрещен."
			)
		}
	}

	@Action("main_menu")
	async onMainMenu(@Ctx() ctx: CallbackQueryContext) {
		try {
			await ctx.editMessageText(
				"Главное меню. Выберите действие:",
				this.keyboardsService.getMainMenu()
			)
		} catch (error) {
			this.logger.warn(
				`Could not edit message for main_menu: ${String(error)}.`
			)
		}

		await ctx.answerCbQuery()
	}

	@Action("restaurants_menu")
	async onRestaurantsMenu(@Ctx() ctx: CallbackQueryContext) {
		try {
			await ctx.editMessageText(
				"Меню управления ресторанами:",
				this.keyboardsService.getRestaurantsMenu()
			)
		} catch (error) {
			this.logger.warn(
				`Could not edit message for restaurants_menu: ${String(error)}.`
			)
		}

		await ctx.answerCbQuery()
	}

	@Action("list_restaurants")
	async onListRestaurants(@Ctx() ctx: CallbackQueryContext) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		const restaurants = await this.restaurantsService.findAll()

		if (restaurants.length === 0) {
			await ctx.editMessageText(
				"В системе пока нет ни одного ресторана.",
				this.keyboardsService.getBackToRestaurantsMenu()
			)

			return ctx.answerCbQuery()
		}

		await ctx.editMessageText(
			"Выберите ресторан для управления:",
			this.keyboardsService.getRestaurantsList(restaurants)
		)

		await ctx.answerCbQuery()
	}

	@Action("create_restaurant")
	async onCreateRestaurant(@Ctx() ctx: MyContext) {
		if (ctx.callbackQuery?.message) {
			const menuMessageId = ctx.callbackQuery.message.message_id

			await ctx.scene.enter("create_restaurant_scene", { menuMessageId })
		}
	}

	@Action(/^view_restaurant:(.+)$/)
	async onViewRestaurant(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		const restaurantId = ctx.match[1]

		try {
			const restaurant = await this.restaurantsService.findOne(restaurantId)

			const message = this.getRestaurantViewMessage(restaurant)

			await ctx.editMessageText(message, {
				parse_mode: "MarkdownV2",
				...this.keyboardsService.getSingleRestaurantMenu(restaurantId),
			})
		} catch (error) {
			if (error instanceof HttpException && error.getStatus() === 404) {
				await ctx.editMessageText(
					"Ошибка: Ресторан не найден. Возможно, он был удален.",
					this.keyboardsService.getBackToRestaurantList()
				)
			} else {
				this.logger.error(`Error fetching restaurant ${restaurantId}:`, error)

				await ctx.editMessageText(
					"Произошла ошибка при получении данных о ресторане."
				)
			}
		}

		await ctx.answerCbQuery()
	}

	@Action(/^edit_restaurant:(.+)$/)
	async onEditRestaurant(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		const restaurantId = ctx.match[1]

		try {
			const restaurant = await this.restaurantsService.findOne(restaurantId)

			await ctx.editMessageReplyMarkup(
				this.keyboardsService.getEditRestaurantMenu(restaurant).reply_markup
			)
		} catch (error) {
			this.logger.error(
				`Error entering edit menu for restaurant ${restaurantId}`,
				error
			)

			await ctx.reply("Не удалось загрузить меню редактирования.")
		}

		await ctx.answerCbQuery()
	}

	@Action(/^toggle_status:(.+)$/)
	async onToggleStatus(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		await ctx.answerCbQuery("Меняю статус...")

		const restaurantId = ctx.match[1]

		try {
			const restaurant = await this.restaurantsService.findOne(restaurantId)
			const updatedRestaurant = await this.restaurantsService.update(
				restaurantId,
				{
					isActive: !restaurant.isActive,
				}
			)

			const newMessage = this.getRestaurantViewMessage(updatedRestaurant)
			const newKeyboard =
				this.keyboardsService.getEditRestaurantMenu(updatedRestaurant)

			await ctx.editMessageText(newMessage, {
				parse_mode: "MarkdownV2",
				...newKeyboard,
			})
		} catch (error) {
			this.logger.error(
				`Error toggling status for restaurant ${restaurantId}`,
				error
			)

			await ctx.reply("Не удалось изменить статус.")
			await ctx.answerCbQuery()
		}
	}

	@Action(/^(edit_name|edit_email|edit_phone):(.+)$/)
	async onEditFieldRequest(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !ctx.callbackQuery.message || !ctx.chat) return

		const actionType = ctx.match[1]
		const restaurantId = ctx.match[2]
		const menuMessageId = ctx.callbackQuery.message.message_id
		const chatId = ctx.chat.id

		let fieldToEdit: UserState["action"]
		let promptText: string

		switch (actionType) {
			case "edit_name":
				fieldToEdit = "editing_restaurant_name"
				promptText = "Введите новое название ресторана:"
				break
			case "edit_email":
				fieldToEdit = "editing_restaurant_email"
				promptText = "Введите новый email:"
				break
			case "edit_phone":
				fieldToEdit = "editing_restaurant_phone"
				promptText = "Введите новый телефон:"
				break
			default:
				return ctx.answerCbQuery("Неизвестное действие.")
		}

		const promptMessage = await ctx.reply(promptText)

		this.userStates.set(ctx.from.id, {
			action: fieldToEdit,
			restaurantId,
			menuMessageId,
			chatId,
			promptMessageId: promptMessage.message_id,
		})

		await ctx.answerCbQuery()
	}

	@On("text")
	async onText(@Ctx() ctx: MyContext & { message: Message.TextMessage }) {
		if (!ctx.from) return

		const userState = this.userStates.get(ctx.from.id)

		if (!userState) return

		const { action, restaurantId, menuMessageId, promptMessageId, chatId } =
			userState
		const newText = ctx.message.text

		if (action === "assigning_bot_token") {
			const workingMessage = await ctx.reply("⏳ Проверяю токен...")
			let resultMessage: string

			try {
				await this.botInstancesService.create({
					botToken: newText,
					restaurantId,
				})

				resultMessage = "✅ Бот успешно привязан!"
			} catch (error) {
				resultMessage =
					error instanceof Error
						? `❌ Ошибка: ${error.message}`
						: "❌ Произошла неизвестная ошибка."
			}

			this.userStates.delete(ctx.from.id)

			try {
				await ctx.deleteMessage(promptMessageId)
				await ctx.deleteMessage(ctx.message.message_id)
				await ctx.deleteMessage(workingMessage.message_id)
			} catch {
				/* ignore */
			}

			const finalMessage = `${resultMessage}\n\nМеню управления ботом:`
			const keyboard = this.keyboardsService.getBotManagementMenu(restaurantId)

			try {
				await ctx.telegram.editMessageText(
					chatId,
					menuMessageId,
					undefined,
					finalMessage,
					keyboard
				)
			} catch {
				await ctx.reply(finalMessage, keyboard)
			}

			return
		}

		if (action.startsWith("editing_restaurant_")) {
			const updateDto: UpdateRestaurantDto = {}

			if (action === "editing_restaurant_name") {
				updateDto.name = newText
			} else if (action === "editing_restaurant_email") {
				updateDto.contactEmail = newText
			} else {
				updateDto.contactPhone = newText
			}

			const updatedRestaurant = await this.restaurantsService.update(
				restaurantId,
				updateDto
			)

			this.userStates.delete(ctx.from.id)

			try {
				await ctx.deleteMessage(promptMessageId)
				await ctx.deleteMessage(ctx.message.message_id)
			} catch {
				/* ignore */
			}

			const message = this.getRestaurantViewMessage(updatedRestaurant)
			const keyboard =
				this.keyboardsService.getEditRestaurantMenu(updatedRestaurant)

			try {
				await ctx.telegram.editMessageText(
					chatId,
					menuMessageId,
					undefined,
					message,
					{
						parse_mode: "MarkdownV2",
						...keyboard,
					}
				)
			} catch {
				await ctx.reply(message, { parse_mode: "MarkdownV2", ...keyboard })
			}

			return
		}
	}

	@Action(/^manage_bot:(.+)$/)
	async onManageBot(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		const restaurantId = ctx.match[1]

		await ctx.editMessageText(
			"Меню управления ботом:",
			this.keyboardsService.getBotManagementMenu(restaurantId)
		)
		await ctx.answerCbQuery()
	}

	@Action(/^assign_token:(.+)$/)
	async onAssignToken(@Ctx() ctx: MyContext & { match: RegExpExecArray }) {
		if (!ctx.from || !ctx.callbackQuery?.message || !ctx.chat) {
			return ctx.answerCbQuery("Произошла ошибка.")
		}

		const restaurantId = ctx.match[1]
		const menuMessageId = ctx.callbackQuery.message.message_id
		const chatId = ctx.chat.id

		const prompt = await ctx.reply("Пришлите токен для этого ресторана.")

		this.userStates.set(ctx.from.id, {
			action: "assigning_bot_token",
			restaurantId,
			menuMessageId,
			chatId,
			promptMessageId: prompt.message_id,
		})

		await ctx.answerCbQuery()
	}

	@Action(/^delete_restaurant_prompt:(.+)$/)
	async onDeleteRestaurantPrompt(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		const restaurantId = ctx.match[1]

		await ctx.editMessageText(
			"Вы уверены, что хотите удалить этот ресторан? Действие необратимо.",
			this.keyboardsService.getDeleteConfirmationMenu(restaurantId)
		)

		await ctx.answerCbQuery()
	}

	@Action(/^delete_restaurant_confirm:(.+)$/)
	async onDeleteRestaurantConfirm(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		await ctx.answerCbQuery("Удаляю ресторан...")

		const restaurantId = ctx.match[1]

		try {
			await this.restaurantsService.remove(restaurantId)

			await ctx.answerCbQuery("✅ Ресторан успешно удален.")

			return this.onListRestaurants(ctx)
		} catch (error) {
			this.logger.error(`Failed to delete restaurant ${restaurantId}`, error)

			await ctx.editMessageText(
				"❌ Не удалось удалить ресторан.",
				this.keyboardsService.getBackToRestaurantList()
			)
		}
	}

	@Action("users_menu")
	async onUsersMenu(@Ctx() ctx: CallbackQueryContext) {
		await ctx.editMessageText(
			"Меню управления пользователями:",
			this.keyboardsService.getUsersMenu()
		)

		await ctx.answerCbQuery()
	}

	@Action("list_users")
	async onListUsers(@Ctx() ctx: CallbackQueryContext) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		const users = await this.usersService.findAll()

		if (users.length === 0) {
			await ctx.editMessageText(
				"В системе пока нет ни одного пользователя.",
				this.keyboardsService.getUsersMenu()
			)

			return ctx.answerCbQuery()
		}

		await ctx.editMessageText(
			"Выберите пользователя для просмотра:",
			this.keyboardsService.getUsersList(users)
		)

		await ctx.answerCbQuery()
	}

	@Action(/^view_user:(.+)$/)
	async onViewUser(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		const userId = ctx.match[1]

		try {
			const user = await this.usersService.findOneById(userId)

			if (!user) {
				await ctx.editMessageText("Пользователь не найден.")
				return ctx.answerCbQuery("Ошибка")
			}

			const message = this.getUserViewMessage(user)
			const keyboard = this.keyboardsService.getUserViewMenu(user)

			await ctx.editMessageText(message, {
				parse_mode: "MarkdownV2",
				...keyboard,
			})
		} catch (error) {
			this.logger.error(`Error fetching user ${userId}`, error)

			await ctx.editMessageText("Произошла ошибка при получении данных.")
		}

		await ctx.answerCbQuery()
	}

	@Action(/^change_status:(.+)$/)
	async onChangeStatus(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		await ctx.answerCbQuery("Меняю статус...")

		const userId = ctx.match[1]

		try {
			const user = await this.usersService.findOneById(userId)

			if (!user) {
				await ctx.editMessageText("Пользователь не найден.")

				return ctx.answerCbQuery("Ошибка")
			}

			const updatedUser = await this.usersService.update(userId, {
				isActive: !user.isActive,
			})

			const message = this.getUserViewMessage(updatedUser)
			const keyboard = this.keyboardsService.getUserViewMenu(updatedUser)

			await ctx.editMessageText(message, {
				parse_mode: "MarkdownV2",
				...keyboard,
			})
		} catch (error) {
			this.logger.error(`Error changing status for user ${userId}`, error)
			await ctx.answerCbQuery("Не удалось изменить статус.")
		}
	}

	@Action(/^change_role:(.+)$/)
	async onChangeRolePrompt(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery("Доступ запрещен.")
		}

		const userId = ctx.match[1]

		await ctx.editMessageText(
			"Выберите новую роль для пользователя:",
			this.keyboardsService.getRoleSelectionMenu(userId)
		)

		await ctx.answerCbQuery()
	}

	@Action(/^set_role:(.+):(.+)$/)
	async onSetRole(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		await ctx.answerCbQuery("Меняю роль...")

		const userId = ctx.match[1]
		const newRole = ctx.match[2] as UserRole

		try {
			const updatedUser = await this.usersService.update(userId, {
				role: newRole,
			})

			const message = this.getUserViewMessage(updatedUser)
			const keyboard = this.keyboardsService.getUserViewMenu(updatedUser)

			await ctx.editMessageText(message, {
				parse_mode: "MarkdownV2",
				...keyboard,
			})
		} catch (error) {
			this.logger.error(`Error changing role for user ${userId}`, error)
			await ctx.answerCbQuery("Не удалось сменить роль.")
		}
	}

	@Action("show_profile")
	async onShowProfile(@Ctx() ctx: CallbackQueryContext) {
		if (!ctx.from) {
			await ctx.answerCbQuery("Не удалось определить пользователя.")

			return
		}

		await this.replyWithWhoAmI(ctx)
		await ctx.answerCbQuery()
	}

	@Command("whoami")
	async onWhoAmICommand(@Ctx() ctx: Context) {
		if (!ctx.from) return

		await this.replyWithWhoAmI(ctx)
	}

	private async replyWithWhoAmI(ctx: Context | CallbackQueryContext) {
		if (!ctx.from) return

		const fromId = ctx.from.id

		const user = await this.usersService.findOneByTelegramUserId(
			fromId.toString()
		)

		let message = ""

		if (user && user.role === UserRole.ADMIN) {
			message = `*Вы авторизованы как ADMIN*\nEmail: ${this.escapeMarkdown(
				user.email || "не указан"
			)}\nTelegram ID: \`${user.telegramUserId}\``
		} else if (user) {
			message = `*Ваш аккаунт найден, но у вас роль ${user.role}, а не ADMIN*\nTelegram ID: \`${user.telegramUserId}\``
		} else {
			message = `*Ваш аккаунт не найден в системе*\nВаш Telegram ID: \`${fromId}\``
		}

		try {
			if (ctx.updateType === "callback_query") {
				await ctx.editMessageText(message, {
					parse_mode: "MarkdownV2",
					...this.keyboardsService.getBackToMainMenu(),
				})
			} else {
				await ctx.reply(message, { parse_mode: "MarkdownV2" })
			}
		} catch (error) {
			this.logger.error(
				`Failed to reply/edit in replyWithWhoAmI: ${String(error)}`
			)
		}
	}

	private escapeMarkdown(text: string): string {
		const escapeChars = [
			"_",
			"*",
			"[",
			"]",
			"(",
			")",
			"~",
			"`",
			">",
			"#",
			"+",
			"-",
			"=",
			"|",
			"{",
			"}",
			".",
			"!",
		]
		return text
			.split("")
			.map(char => (escapeChars.includes(char) ? "\\" + char : char))
			.join("")
	}
}
