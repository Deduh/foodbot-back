import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
} from "class-validator"

export class CreateRestaurantOwnerDto {
	@IsString({ message: "Telegram User ID должен быть строкой." })
	@IsNotEmpty({ message: "Telegram User ID не должен быть пустым." })
	telegramUserId: string

	@IsUUID("4", { message: "ID ресторана должен быть валидным UUID v4." })
	@IsNotEmpty({ message: "ID ресторана не должен быть пустым." })
	restaurantId: string

	@IsOptional()
	@IsEmail({}, { message: "Пожалуйста, введите корректный email." })
	email?: string

	@IsOptional()
	@IsString({
		message: "Имя пользователя (Telegram @username) должно быть строкой.",
	})
	username?: string
}
