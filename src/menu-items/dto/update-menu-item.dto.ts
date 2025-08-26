import { ApiProperty } from "@nestjs/swagger"
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Min,
} from "class-validator"

export class UpdateMenuItemDto {
	@ApiProperty({
		example: "Маргарита",
		description: "Название блюда",
	})
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	@ApiProperty({ example: "199,99", description: "Цена блюда" })
	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	price?: number

	@ApiProperty({
		example: "Пицца с колбасками и сыром",
		description: "Описание блюда",
	})
	@IsOptional()
	@IsString()
	description?: string

	@ApiProperty({
		example: "https://example.com/image.jpg",
		description: "Ссылка на изображение блюда",
	})
	@IsOptional()
	@IsString()
	imageUrl?: string

	@ApiProperty({
		example: "3",
		description: "Порядковый номер в меню",
	})
	@IsOptional()
	@IsInt()
	displayOrder?: number

	@ApiProperty({
		example: "true",
		description: "Статус активности",
	})
	@IsOptional()
	@IsBoolean()
	isActive?: boolean
}
