import { ApiProperty } from "@nestjs/swagger"
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from "class-validator"

export class CreateMenuItemDto {
	@ApiProperty({ example: "Пепперони", description: "Название блюда" })
	@IsString()
	@IsNotEmpty({ message: "Название блюда не должно быть пустым." })
	name: string

	@ApiProperty({ example: "199,99", description: "Цена блюда" })
	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{
			message:
				"Цена должна быть числом с максимум двумя знаками после запятой.",
		}
	)
	@Min(0, { message: "Цена не может быть отрицательной." })
	price: number

	@ApiProperty({
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
		description: "ID категории",
	})
	@IsUUID("4", { message: "ID категории должен быть в формате UUID." })
	@IsNotEmpty()
	categoryId: string

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
}
