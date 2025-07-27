import { HttpException, Injectable, Logger } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { Action, Command, Ctx, Help, Start, Update } from 'nestjs-telegraf'
import { RestaurantsService } from 'src/restaurants/restaurants.service'
import { Context, Markup } from 'telegraf'
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram'
import { UsersService } from '../users/users.service'
import { CallbackQueryContext } from './types/admin-bot.types'

@Update()
@Injectable()
export class AdminBotService {
	private readonly logger = new Logger(AdminBotService.name)

	constructor(
		private readonly usersService: UsersService,
		private readonly restaurantsService: RestaurantsService
	) {}

	private async isAdmin(telegramUserId: number): Promise<boolean> {
		const user = await this.usersService.findOneByTelegramUserId(
			telegramUserId.toString()
		)

		return user?.role === UserRole.ADMIN
	}

	private getMainMenuKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback('Управление ресторанами', 'restaurants_menu')],
			[Markup.button.callback('Управление пользователями', 'users_menu')],
			[Markup.button.callback('Мой профиль', 'show_profile')],
		])
	}

	private getRestaurantsMenuKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback('📋 Список ресторанов', 'list_restaurants')],
			[Markup.button.callback('➕ Создать ресторан', 'create_restaurant')],
			[Markup.button.callback('« Назад в главное меню', 'main_menu')],
		])
	}

	private getSingleRestaurantMenuKeyboard(
		restaurantId: string
	): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.callback(
					'✏️ Редактировать',
					`edit_restaurant:${restaurantId}`
				),
			],
			[Markup.button.callback('🍔 Упр. меню', `manage_menu:${restaurantId}`)],
			[Markup.button.callback('🤖 Упр. ботом', `manage_bot:${restaurantId}`)],
			[Markup.button.callback('« Назад к списку', 'list_restaurants')],
		])
	}

	private getUsersMenuKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback('Подтвердить оплату', 'confirm_payment_start')],
			[Markup.button.callback('« Назад в главное меню', 'main_menu')],
		])
	}

	@Start()
	@Help()
	async onStart(@Ctx() ctx: Context) {
		if (!ctx.from) return
		if (await this.isAdmin(ctx.from.id)) {
			await ctx.reply(
				'Добро пожаловать, Администратор! Выберите действие:',
				this.getMainMenuKeyboard()
			)
		} else {
			await ctx.reply(
				'Здравствуйте! Этот бот предназначен для администрирования платформы. Доступ запрещен.'
			)
		}
	}

	@Action('main_menu')
	async onMainMenu(@Ctx() ctx: CallbackQueryContext) {
		try {
			await ctx.editMessageText(
				'Главное меню. Выберите действие:',
				this.getMainMenuKeyboard()
			)
		} catch (error) {
			this.logger.warn(
				`Could not edit message for main_menu: ${String(error)}.`
			)
		}

		await ctx.answerCbQuery()
	}

	@Action('restaurants_menu')
	async onRestaurantsMenu(@Ctx() ctx: CallbackQueryContext) {
		try {
			await ctx.editMessageText(
				'Меню управления ресторанами:',
				this.getRestaurantsMenuKeyboard()
			)
		} catch (error) {
			this.logger.warn(
				`Could not edit message for restaurants_menu: ${String(error)}.`
			)
		}

		await ctx.answerCbQuery()
	}

	@Action('list_restaurants')
	async onListRestaurants(@Ctx() ctx: CallbackQueryContext) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery('Доступ запрещен.')
		}

		const restaurants = await this.restaurantsService.findAll()

		if (restaurants.length === 0) {
			await ctx.editMessageText(
				'В системе пока нет ни одного ресторана.',
				Markup.inlineKeyboard([
					[Markup.button.callback('« Назад', 'restaurants_menu')],
				])
			)

			return ctx.answerCbQuery()
		}

		const buttons = restaurants.map(r =>
			Markup.button.callback(r.name, `view_restaurant:${r.id}`)
		)

		const keyboard = Markup.inlineKeyboard([
			...buttons.map(btn => [btn]),
			[Markup.button.callback('« Назад', 'restaurants_menu')],
		])

		try {
			await ctx.editMessageText('Выберите ресторан для управления:', keyboard)
		} catch (error) {
			this.logger.error(
				`Failed to edit message with restaurant list: ${String(error)}`
			)

			await ctx.reply('Не удалось обновить список.')
		}

		await ctx.answerCbQuery()
	}

	@Action(/^view_restaurant:(.+)$/)
	async onViewRestaurant(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		if (!ctx.from || !(await this.isAdmin(ctx.from.id))) {
			return ctx.answerCbQuery('Доступ запрещен.')
		}

		const restaurantId = ctx.match[1]

		try {
			const restaurant = await this.restaurantsService.findOne(restaurantId)

			const message = `*Управление рестораном: ${this.escapeMarkdown(
				restaurant.name
			)}*
				ID: \`${restaurant.id}\`
				Статус: ${restaurant.isActive ? 'Активен' : 'Неактивен'}
				Email: ${this.escapeMarkdown(restaurant.contactEmail || 'не указан')}
				Телефон: ${this.escapeMarkdown(restaurant.contactPhone || 'не указан')}`

			await ctx.editMessageText(message, {
				parse_mode: 'MarkdownV2',
				...this.getSingleRestaurantMenuKeyboard(restaurantId),
			})
		} catch (error) {
			if (error instanceof HttpException && error.getStatus() === 404) {
				await ctx.editMessageText(
					'Ошибка: Ресторан не найден. Возможно, он был удален.',
					Markup.inlineKeyboard([
						[Markup.button.callback('« Назад к списку', 'list_restaurants')],
					])
				)
			} else {
				this.logger.error(`Error fetching restaurant ${restaurantId}:`, error)

				await ctx.editMessageText(
					'Произошла ошибка при получении данных о ресторане.'
				)
			}
		}

		await ctx.answerCbQuery()
	}

	@Action('users_menu')
	async onUsersMenu(@Ctx() ctx: CallbackQueryContext) {
		await ctx.editMessageText(
			'Меню управления пользователями:',
			this.getUsersMenuKeyboard()
		)

		await ctx.answerCbQuery()
	}

	@Action('show_profile')
	async onShowProfile(@Ctx() ctx: CallbackQueryContext) {
		if (!ctx.from) {
			await ctx.answerCbQuery('Не удалось определить пользователя.')

			return
		}

		await this.replyWithWhoAmI(ctx)
		await ctx.answerCbQuery()
	}

	@Command('whoami')
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

		let message = ''

		if (user && user.role === UserRole.ADMIN) {
			message = `*Вы авторизованы как ADMIN*
				Email: ${this.escapeMarkdown(user.email || 'не указан')}
				Telegram ID: \`${user.telegramUserId}\``
		} else if (user) {
			message = `*Ваш аккаунт найден, но у вас роль ${user.role}, а не ADMIN*
				Telegram ID: \`${user.telegramUserId}\``
		} else {
			message = `*Ваш аккаунт не найден в системе*
				Ваш Telegram ID: \`${fromId}\``
		}

		try {
			if (ctx.updateType === 'callback_query') {
				await ctx.editMessageText(message, {
					parse_mode: 'MarkdownV2',
					reply_markup: {
						inline_keyboard: [
							[Markup.button.callback('« Назад в главное меню', 'main_menu')],
						],
					},
				})
			} else {
				await ctx.reply(message, { parse_mode: 'MarkdownV2' })
			}
		} catch (error) {
			this.logger.error(
				`Failed to reply/edit in replyWithWhoAmI: ${String(error)}`
			)

			await ctx.reply(
				'Не удалось обновить предыдущее сообщение. Вот ваша информация:'
			)

			await ctx.reply(message, { parse_mode: 'MarkdownV2' })
		}
	}

	private escapeMarkdown(text: string): string {
		const escapeChars = [
			'_',
			'*',
			'[',
			']',
			'(',
			')',
			'~',
			'`',
			'>',
			'#',
			'+',
			'-',
			'=',
			'|',
			'{',
			'}',
			'.',
			'!',
		]

		return text
			.split('')
			.map(char => (escapeChars.includes(char) ? '\\' + char : char))
			.join('')
	}
}
