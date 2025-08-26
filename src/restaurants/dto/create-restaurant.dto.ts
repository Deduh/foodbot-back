import { ApiProperty } from "@nestjs/swagger"
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
} from "class-validator"

export class CreateRestaurantDto {
	@ApiProperty({
		example: "Пиццерия у Никиты",
		description: "Название ресторана",
	})
	@IsString({ message: "Название ресторана должно быть строкой." })
	@IsNotEmpty({ message: "Название ресторана не должно быть пустым." })
	name: string

	@ApiProperty({
		example: "contact@pizzeria.com",
		description: "Контактный email",
		required: false,
	})
	@IsOptional()
	@IsEmail({}, { message: "Пожалуйста, введите корректный контактный email." })
	contactEmail?: string

	@ApiProperty({
		example: "+7(999)999-99-99",
		description: "Контактный телефон",
		required: false,
	})
	@IsOptional()
	@IsString({ message: "Контактный телефон должен быть строкой." })
	contactPhone?: string

	@ApiProperty({
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
		description: "UUID владельца ресторана",
	})
	@IsUUID("4", { message: "ID владельца должен быть в формате UUID." })
	@IsNotEmpty({ message: "Необходимо указать владельца ресторана." })
	ownerId: string
}
