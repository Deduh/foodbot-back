import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"

export class CreateBotInstanceDto {
	@IsUUID("4", { message: "ID ресторана должен быть валидным UUID v4." })
	@IsNotEmpty({ message: "ID ресторана не должен быть пустым." })
	restaurantId: string

	@IsString({ message: "Токен бота должен быть строкой." })
	@IsNotEmpty({ message: "Токен бота не должен быть пустым." })
	botToken: string

	@IsOptional()
	@IsString()
	botUsername?: string
}
