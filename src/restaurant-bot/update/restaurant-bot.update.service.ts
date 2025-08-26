import { Injectable } from "@nestjs/common"
import { OrderStatus, UserRole } from "@prisma/client"
import { Action, Ctx, Start } from "nestjs-telegraf"
import { CallbackQueryContext } from "src/admin-bot/types/admin-bot.types"
import { OrdersService } from "src/orders/orders.service"
import { UsersService } from "src/users/users.service"
import { Context } from "telegraf"
import { RestaurantBotKeyboardsService } from "../keyboards/restaurant-bot.keyboards.service"

@Injectable()
export class RestaurantBotUpdate {
	constructor(
		private readonly usersService: UsersService,
		private readonly keyboardsService: RestaurantBotKeyboardsService,
		private readonly ordersService: OrdersService
	) {}

	@Start()
	async onStart(@Ctx() ctx: Context) {
		if (!ctx.from) return

		const telegramUserId = ctx.from.id.toString()
		let user = await this.usersService.findOneByTelegramUserId(telegramUserId)

		if (!user) {
			user = await this.usersService.create({
				telegramUserId,
				username: ctx.from.username,
				role: UserRole.CUSTOMER,
			})
		}

		if (user.role === UserRole.RESTAURANT_OWNER) {
			// TODO: Добавить проверку, что этот владелец привязан именно к ЭТОМУ боту
			await ctx.reply(
				`Добро пожаловать, владелец!`,
				this.keyboardsService.getOwnerMainMenu()
			)
		} else {
			await ctx.reply(
				"Добро пожаловать! Сделайте ваш первый заказ.",
				this.keyboardsService.getCustomerMainMenu()
			)
		}
	}

	@Action(/^accept_order:(.+)$/)
	async onAcceptOrder(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		await ctx.answerCbQuery("Принимаем заказ...")

		const orderId = ctx.match[1]
		const message = ctx.callbackQuery?.message

		if (message && "text" in message) {
			try {
				await this.ordersService.updateStatus(
					orderId,
					{ status: OrderStatus.CONFIRMED },
					ctx.from.id.toString()
				)

				await ctx.editMessageText(`${message.text}\n\n✅ *Заказ принят*`, {
					parse_mode: "MarkdownV2",
				})
			} catch (error) {
				await this.handleActionError(ctx, error)
			}
		} else {
			await this.handleActionError(
				ctx,
				new Error("Не удалось найти исходное сообщение.")
			)
		}
	}

	@Action(/^decline_order:(.+)$/)
	async onDeclineOrder(
		@Ctx() ctx: CallbackQueryContext & { match: RegExpExecArray }
	) {
		await ctx.answerCbQuery("Отклоняем заказ...")

		const orderId = ctx.match[1]
		const message = ctx.callbackQuery?.message

		if (message && "text" in message) {
			try {
				await this.ordersService.updateStatus(
					orderId,
					{ status: OrderStatus.CANCELLED_BY_RESTAURANT },
					ctx.from.id.toString()
				)

				await ctx.editMessageText(`${message.text}\n\n❌ *Заказ отклонен*`, {
					parse_mode: "MarkdownV2",
				})
			} catch (error) {
				await this.handleActionError(ctx, error)
			}
		} else {
			await this.handleActionError(
				ctx,
				new Error("Не удалось найти исходное сообщение.")
			)
		}
	}

	private async handleActionError(ctx: CallbackQueryContext, error: unknown) {
		if (error instanceof Error) {
			await ctx.answerCbQuery(`❌ Ошибка: ${error.message}`, {
				show_alert: true,
			})
		} else {
			await ctx.answerCbQuery("❌ Произошла неизвестная ошибка.", {
				show_alert: true,
			})
		}
	}
}
