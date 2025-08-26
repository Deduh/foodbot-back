import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsUUID } from "class-validator"

export class CreateMenuCategoryDto {
	@ApiProperty({ example: "Пицца", description: "Название категории меню" })
	@IsString()
	@IsNotEmpty({ message: "Название категории не должно быть пустым." })
	name: string

	@ApiProperty({
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
		description: "ID ресторана",
	})
	@IsUUID("4", { message: "ID ресторана должен быть в формате UUID." })
	@IsNotEmpty()
	restaurantId: string
}
