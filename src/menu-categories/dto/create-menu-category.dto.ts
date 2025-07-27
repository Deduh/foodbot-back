import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator'

export class CreateMenuCategoryDto {
	@IsString()
	@IsNotEmpty()
	name: string

	@IsOptional()
	@IsInt()
	@Min(0)
	displayOrder?: number

	@IsOptional()
	@IsBoolean()
	isActive?: boolean

	@IsOptional()
	@IsUUID('4', { message: 'restaurantId должен быть валидным UUID' })
	restaurantId?: string
}
