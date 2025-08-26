import { Injectable } from "@nestjs/common"
import { Restaurant, User, UserRole } from "@prisma/client"
import { Markup } from "telegraf"
import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram"

@Injectable()
export class AdminBotKeyboardsService {
	public getMainMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback("Управление ресторанами", "restaurants_menu")],
			[Markup.button.callback("Управление пользователями", "users_menu")],
			[Markup.button.callback("Мой профиль", "show_profile")],
		])
	}

	public getRestaurantsMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback("📋 Список ресторанов", "list_restaurants")],
			[Markup.button.callback("➕ Создать ресторан", "create_restaurant")],
			[Markup.button.callback("« Назад в главное меню", "main_menu")],
		])
	}

	public getSingleRestaurantMenu(
		restaurantId: string
	): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.callback(
					"✏️ Редактировать",
					`edit_restaurant:${restaurantId}`
				),
			],
			[Markup.button.callback("🍔 Упр. меню", `manage_menu:${restaurantId}`)],
			[Markup.button.callback("🤖 Упр. ботом", `manage_bot:${restaurantId}`)],
			[
				Markup.button.callback(
					"❌ Удалить",
					`delete_restaurant_prompt:${restaurantId}`
				),
			],
			[Markup.button.callback("« Назад к списку", "list_restaurants")],
		])
	}

	public getRestaurantsList(
		restaurants: Restaurant[]
	): Markup.Markup<InlineKeyboardMarkup> {
		const buttons = restaurants.map(r =>
			Markup.button.callback(r.name, `view_restaurant:${r.id}`)
		)

		return Markup.inlineKeyboard([
			...buttons.map(btn => [btn]),
			[Markup.button.callback("« Назад", "restaurants_menu")],
		])
	}

	public getBackToRestaurantsMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback("« Назад", "restaurants_menu")],
		])
	}

	public getBackToRestaurantList(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback("« Назад к списку", "list_restaurants")],
		])
	}

	public getBackToMainMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback("« Назад в главное меню", "main_menu")],
		])
	}

	public getEditRestaurantMenu(
		restaurant: Restaurant
	): Markup.Markup<InlineKeyboardMarkup> {
		const statusButton = restaurant.isActive
			? Markup.button.callback(
					"🔴 Сделать неактивным",
					`toggle_status:${restaurant.id}`
				)
			: Markup.button.callback(
					"🟢 Сделать активным",
					`toggle_status:${restaurant.id}`
				)

		return Markup.inlineKeyboard([
			[statusButton],
			[Markup.button.callback("✏️ Название", `edit_name:${restaurant.id}`)],
			[Markup.button.callback("✉️ Email", `edit_email:${restaurant.id}`)],
			[Markup.button.callback("📞 Телефон", `edit_phone:${restaurant.id}`)],
			[
				Markup.button.callback(
					"« Назад к ресторану",
					`view_restaurant:${restaurant.id}`
				),
			],
		])
	}

	public getBotManagementMenu(
		restaurantId: string
	): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.callback(
					"🔌 Привязать/Изменить токен",
					`assign_token:${restaurantId}`
				),
			],
			[
				Markup.button.callback(
					"« Назад к ресторану",
					`view_restaurant:${restaurantId}`
				),
			],
		])
	}

	public getDeleteConfirmationMenu(
		restaurantId: string
	): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[
				Markup.button.callback(
					"✅ Да, удалить",
					`delete_restaurant_confirm:${restaurantId}`
				),
				Markup.button.callback(
					"« Нет, отмена",
					`view_restaurant:${restaurantId}`
				),
			],
		])
	}

	public getUsersMenu(): Markup.Markup<InlineKeyboardMarkup> {
		return Markup.inlineKeyboard([
			[Markup.button.callback("📋 Список пользователей", "list_users")],
			[Markup.button.callback("« Назад в главное меню", "main_menu")],
		])
	}

	public getUsersList(users: User[]): Markup.Markup<InlineKeyboardMarkup> {
		const buttons = users.map(u => {
			const displayName = u.username || u.telegramUserId

			return Markup.button.callback(
				`👤 ${displayName} (${u.role})`,
				`view_user:${u.id}`
			)
		})

		return Markup.inlineKeyboard([
			...buttons.map(btn => [btn]),
			[Markup.button.callback("« Назад", "users_menu")],
		])
	}

	public getUserViewMenu(user: User): Markup.Markup<InlineKeyboardMarkup> {
		const statusButton = user.isActive
			? Markup.button.callback(
					"🔴 Сделать неактивным",
					`change_status:${user.id}`
				)
			: Markup.button.callback(
					"🟢 Сделать активным",
					`change_status:${user.id}`
				)

		return Markup.inlineKeyboard([
			[
				Markup.button.callback("👑 Сменить роль", `change_role:${user.id}`),
				statusButton,
			],
			[Markup.button.callback("« Назад к списку", "list_users")],
		])
	}

	public getRoleSelectionMenu(
		userId: string
	): Markup.Markup<InlineKeyboardMarkup> {
		const roles = Object.values(UserRole)

		const buttons = roles.map(role =>
			Markup.button.callback(`👑 ${role}`, `set_role:${userId}:${role}`)
		)

		return Markup.inlineKeyboard([
			...this.chunkArray(buttons, 2),
			[Markup.button.callback("« Назад к пользователю", `view_user:${userId}`)],
		])
	}

	private chunkArray<T>(array: T[], size: number): T[][] {
		const result: T[][] = []

		for (let i = 0; i < array.length; i += size) {
			result.push(array.slice(i, i + size))
		}

		return result
	}
}
