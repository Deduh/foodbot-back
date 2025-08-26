import { Context, Scenes } from "telegraf"
import { Update } from "telegraf/typings/core/types/typegram"

export interface CreateRestaurantState {
	name?: string
	contactEmail?: string
	contactPhone?: string
	ownerId?: string
	messageIdsToDelete?: number[]
	menuMessageId?: number
	chatId?: number
}

export type UserState = {
	action:
		| "editing_restaurant_name"
		| "editing_restaurant_email"
		| "editing_restaurant_phone"
		| "assigning_bot_token"
	restaurantId: string
	menuMessageId: number
	promptMessageId: number
	chatId: number
}

export interface MyWizardSession extends Scenes.WizardSessionData {
	state: CreateRestaurantState
}

export type MyContext = Scenes.WizardContext<MyWizardSession>

export type CallbackQueryContext = Context<Update.CallbackQueryUpdate>
