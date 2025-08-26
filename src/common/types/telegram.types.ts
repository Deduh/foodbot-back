export interface TelegramUserData {
	id: number
	first_name: string
	last_name?: string
	username?: string
	language_code?: string
	is_premium?: boolean
}

export interface TelegramBotInfo {
	id: number
	is_bot: boolean
	first_name: string
	username: string
}

export interface TelegramResponse<TResult> {
	ok: boolean
	result?: TResult
	description?: string
	error_code?: number
}
