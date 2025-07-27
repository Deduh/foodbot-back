import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateRestaurantDto {
	@IsString({ message: 'Название ресторана должно быть строкой.' })
	@IsNotEmpty({ message: 'Название ресторана не должно быть пустым.' })
	name: string

	@IsOptional()
	@IsEmail({}, { message: 'Пожалуйста, введите корректный контактный email.' })
	contactEmail?: string

	@IsOptional()
	@IsString({ message: 'Контактный телефон должен быть строкой.' })
	contactPhone?: string
}
