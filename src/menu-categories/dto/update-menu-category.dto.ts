import { ApiProperty } from "@nestjs/swagger"
import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
} from "class-validator"

export class UpdateMenuCategoryDto {
	@ApiProperty({ example: "Пицца", description: "Название категории меню" })
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	@ApiProperty({ example: "1", description: "Порядок отображения" })
	@IsOptional()
	@IsInt({ message: "Порядок отображения должен быть целым числом." })
	displayOrder?: number

	@ApiProperty({ example: "true", description: "Статус активности" })
	@IsOptional()
	@IsBoolean({ message: "Статус активности должен быть булевым значением." })
	isActive?: boolean
}
