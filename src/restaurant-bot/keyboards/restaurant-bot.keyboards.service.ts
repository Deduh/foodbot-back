import { Injectable } from "@nestjs/common"
import { Markup } from "telegraf"
import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram"

@Injectable()
export class RestaurantBotKeyboardsService {
	public getOwnerMainMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.webApp(
					"🍔 Управление меню",
					"https://your-mini-app-url.com/owner/menu"
				),
			],
			[
				Markup.button.webApp(
					"📋 Мои заказы",
					"https://your-mini-app-url.com/owner/orders"
				),
			],
			[
				Markup.button.webApp(
					"⚙️ Настройки",
					"https://your-mini-app-url.com/owner/settings"
				),
			],
		])
	}

	public getCustomerMainMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.webApp(
					"🍕 Открыть меню и сделать заказ",
					"https://your-mini-app-url.com/customer"
				),
			],
		])
	}

	public getNewOrderKeyboard(
		orderId: string
	): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.callback("✅ Принять", `accept_order:${orderId}`),
				Markup.button.callback("❌ Отклонить", `decline_order:${orderId}`),
			],
		])
	}
}
