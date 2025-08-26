import { ApiProperty } from "@nestjs/swagger"
import {
	IsBoolean,
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator"

export class UpdateRestaurantDto {
	@ApiProperty({
		example: "Новое название",
		description: "Новое название ресторана",
		required: false,
	})
	@IsOptional()
	@IsString({ message: "Название ресторана должно быть строкой." })
	@IsNotEmpty({ message: "Название ресторана не должно быть пустым." })
	name?: string

	@ApiProperty({
		example: "new@pizzeria.com",
		description: "Новый контактный email",
		required: false,
	})
	@IsOptional()
	@IsEmail({}, { message: "Пожалуйста, введите корректный контактный email." })
	contactEmail?: string

	@ApiProperty({
		example: "+7(111)222-33-44",
		description: "Новый контактный телефон",
		required: false,
	})
	@IsOptional()
	@IsString({ message: "Контактный телефон должен быть строкой." })
	contactPhone?: string

	@ApiProperty({
		example: false,
		description: "Статус активности ресторана",
		required: false,
	})
	@IsOptional()
	@IsBoolean({ message: "Статус активности должен быть булевым значением." })
	isActive?: boolean
}
