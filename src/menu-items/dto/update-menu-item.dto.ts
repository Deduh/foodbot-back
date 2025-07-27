import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Min,
} from 'class-validator'

export class UpdateMenuItemDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	@IsOptional()
	@IsString()
	description?: string

	@IsOptional()
	@IsNumber(
		{ maxDecimalPlaces: 2 },
		{ message: 'Цена должна быть числом с максимум 2 знаками после запятой.' }
	)
	@IsPositive({ message: 'Цена должна быть положительным числом.' })
	price?: number

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
}
