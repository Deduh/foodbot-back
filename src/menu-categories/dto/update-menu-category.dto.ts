import {
	IsBoolean,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	Min,
} from 'class-validator'

export class UpdateMenuCategoryDto {
	@IsOptional()
	@IsString()
	@IsNotEmpty()
	name?: string

	@IsOptional()
	@IsInt()
	@Min(0)
	displayOrder?: number

	@IsOptional()
	@IsBoolean()
	isActive?: boolean
}
