import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUUID,
	Min,
} from 'class-validator'

export class CreateMenuItemDto {
	@IsString()
	@IsNotEmpty()
	name: string

	@IsOptional()
	@IsString()
	description?: string

	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: 'Цена должна быть числом с максимум 2 знаками после запятой.' }
	)
	@IsPositive({ message: 'Цена должна быть положительным числом.' })
	@IsNotEmpty()
	price: number

	@IsOptional()
	@IsString()
	imageUrl?: string

	@IsOptional()
	@IsInt()
	@Min(0)
	displayOrder?: number

	@IsOptional()
	@IsBoolean()
	isActive?: boolean

	@IsUUID('4', { message: 'categoryId должен быть валидным UUID.' })
	@IsNotEmpty()
	categoryId: string
}
