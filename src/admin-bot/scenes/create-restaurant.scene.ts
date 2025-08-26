import { Action, Command, Ctx, On, SceneEnter, Wizard } from "nestjs-telegraf"
import { RestaurantsService } from "src/restaurants/restaurants.service"
import { UsersService } from "src/users/users.service"
import { Markup } from "telegraf"
import { Message } from "telegraf/typings/core/types/typegram"
import { ExtraReplyMessage } from "telegraf/typings/telegram-types"
import { AdminBotKeyboardsService } from "../keyboards/admin-bot.keyboards.service"
import { MyContext } from "../types/admin-bot.types"

@Wizard("create_restaurant_scene")
export class CreateRestaurantScene {
	constructor(
		private readonly restaurantsService: RestaurantsService,
		private readonly keyboardsService: AdminBotKeyboardsService,
		private readonly usersService: UsersService
	) {}

	private async replyAndSaveMessageIds(
		ctx: MyContext,
		text: string,
		extra?: ExtraReplyMessage
	) {
		if (
			!ctx.scene.session.state ||
			!ctx.scene.session.state.messageIdsToDelete
		) {
			return
		}

		if (ctx.message) {
			ctx.scene.session.state.messageIdsToDelete.push(ctx.message.message_id)
		}

		const botMessage = await ctx.reply(text, extra)

		ctx.scene.session.state.messageIdsToDelete.push(botMessage.message_id)
	}

	private async cleanup(ctx: MyContext) {
		if (!ctx.scene.session.state?.messageIdsToDelete) {
			return
		}

		for (const messageId of ctx.scene.session.state.messageIdsToDelete) {
			try {
				await ctx.deleteMessage(messageId)
			} catch {
				// ignore
			}
		}

		if (ctx.scene.session.state) {
			ctx.scene.session.state.messageIdsToDelete = []
		}
	}

	private async handleCancel(ctx: MyContext) {
		if (!ctx.scene.session.state) {
			await ctx.scene.leave()
			await ctx.reply(
				"Произошла ошибка состояния. Вы вернулись в главное меню.",
				this.keyboardsService.getMainMenu()
			)

			return
		}

		const { menuMessageId } = ctx.scene.session.state

		if (!ctx.scene.session.state.messageIdsToDelete) {
			ctx.scene.session.state.messageIdsToDelete = []
		}

		if (ctx.message) {
			ctx.scene.session.state.messageIdsToDelete.push(ctx.message.message_id)
		} else if (ctx.callbackQuery?.message) {
			ctx.scene.session.state.messageIdsToDelete.push(
				ctx.callbackQuery.message.message_id
			)
		}

		await this.cleanup(ctx)
		await ctx.scene.leave()

		if (menuMessageId && ctx.chat) {
			try {
				await ctx.telegram.editMessageText(
					ctx.chat.id,
					menuMessageId,
					undefined,
					"Создание отменено. Вы в меню управления ресторанами.",
					this.keyboardsService.getRestaurantsMenu()
				)
			} catch {
				await ctx.reply(
					"Создание отменено. Вы вернулись в меню.",
					this.keyboardsService.getRestaurantsMenu()
				)
			}
		} else {
			await ctx.reply(
				"Создание отменено. Вы вернулись в главное меню.",
				this.keyboardsService.getMainMenu()
			)
		}
	}

	@SceneEnter()
	async onSceneEnter(@Ctx() ctx: MyContext) {
		ctx.scene.session.state = {
			messageIdsToDelete: [],
		}

		const initialState = ctx.scene.state as { menuMessageId?: number }

		if (initialState?.menuMessageId) {
			ctx.scene.session.state.menuMessageId = initialState.menuMessageId
		}

		await this.replyAndSaveMessageIds(
			ctx,
			"Введите название нового ресторана. Для отмены введите /cancel."
		)
	}

	@On("text")
	async onText(@Ctx() ctx: MyContext & { message: Message.TextMessage }) {
		const text = ctx.message.text

		if (text === "/cancel") {
			return this.handleCancel(ctx)
		}

		switch (ctx.wizard.cursor) {
			case 0:
				ctx.scene.session.state.name = text
				await this.replyAndSaveMessageIds(
					ctx,
					"Отлично! Теперь введите контактный email."
				)
				ctx.wizard.next()
				break
			case 1:
				ctx.scene.session.state.contactEmail = text
				await this.replyAndSaveMessageIds(
					ctx,
					"Принято. Теперь введите контактный телефон."
				)
				ctx.wizard.next()
				break
			case 2: {
				ctx.scene.session.state.contactPhone = text

				const users = await this.usersService.findAll()

				if (users.length === 0) {
					await ctx.reply(
						"В системе нет пользователей для назначения владельцем. Сначала создайте пользователя."
					)

					return ctx.scene.leave()
				}

				const buttons = users.map(u =>
					Markup.button.callback(
						u.username || u.telegramUserId,
						`select_owner:${u.id}`
					)
				)
				const keyboard = Markup.inlineKeyboard(buttons.map(btn => [btn]))

				await this.replyAndSaveMessageIds(
					ctx,
					"Отлично. Теперь выберите владельца для этого ресторана:",
					keyboard
				)

				ctx.wizard.next()

				break
			}
		}
	}

	@Action(/^select_owner:(.+)$/)
	async onOwnerSelect(@Ctx() ctx: MyContext & { match: RegExpExecArray }) {
		await ctx.answerCbQuery()

		const ownerId = ctx.match[1]

		const owner = await this.usersService.findOneById(ownerId)

		if (!owner) {
			await ctx.reply(
				"Ошибка: Выбранный пользователь не найден. Возможно, он был удален. Попробуйте снова."
			)

			return ctx.scene.leave()
		}

		ctx.scene.session.state.ownerId = ownerId

		const { name, contactEmail, contactPhone } = ctx.scene.session.state

		await ctx.replyWithHTML(
			`<b>Проверьте данные:</b>\n\n` +
				`<b>Название:</b> ${name}\n` +
				`<b>Email:</b> ${contactEmail}\n` +
				`<b>Телефон:</b> ${contactPhone}\n` +
				`<b>Владелец:</b> ${owner.username || owner.telegramUserId}\n\n` +
				`Все верно?`,
			{
				reply_markup: {
					inline_keyboard: [
						[{ text: "✅ Да, создать", callback_data: "confirm_create" }],
						[{ text: "❌ Нет, отменить", callback_data: "cancel_create" }],
					],
				},
			}
		)
	}

	@Action("confirm_create")
	async onConfirm(@Ctx() ctx: MyContext) {
		if (
			!ctx.scene.session.state ||
			!ctx.scene.session.state.messageIdsToDelete
		) {
			await ctx.reply("Произошла ошибка состояния. Попробуйте снова.")

			return ctx.scene.leave()
		}

		const { name, contactEmail, contactPhone, menuMessageId, ownerId } =
			ctx.scene.session.state

		if (!ownerId) {
			await ctx.reply("Ошибка: владелец не был выбран. Попробуйте снова.")
			return ctx.scene.leave()
		}

		await this.restaurantsService.create({
			name: name!,
			contactEmail: contactEmail!,
			contactPhone: contactPhone!,
			ownerId: ownerId,
		})

		if (ctx.callbackQuery?.message) {
			ctx.scene.session.state.messageIdsToDelete.push(
				ctx.callbackQuery.message.message_id
			)
		}

		await this.cleanup(ctx)
		await ctx.scene.leave()

		if (menuMessageId && ctx.chat) {
			try {
				await ctx.telegram.editMessageText(
					ctx.chat.id,
					menuMessageId,
					undefined,
					"✅ Ресторан успешно создан!\n\nВы в меню управления ресторанами.",
					this.keyboardsService.getRestaurantsMenu()
				)
			} catch {
				await ctx.reply(
					"✅ Ресторан успешно создан!\n\nВы вернулись в меню управления ресторанами.",
					this.keyboardsService.getRestaurantsMenu()
				)
			}
		}
	}

	@Action("cancel_create")
	async onCancel(@Ctx() ctx: MyContext) {
		if (!ctx.scene.session.state) {
			return ctx.scene.leave()
		}

		if (ctx.callbackQuery?.message) {
			if (!ctx.scene.session.state.messageIdsToDelete) {
				ctx.scene.session.state.messageIdsToDelete = []
			}

			ctx.scene.session.state.messageIdsToDelete.push(
				ctx.callbackQuery.message.message_id
			)
		}

		return this.handleCancel(ctx)
	}

	@Command("cancel")
	async onCancelCommand(@Ctx() ctx: MyContext) {
		return this.handleCancel(ctx)
	}
}
