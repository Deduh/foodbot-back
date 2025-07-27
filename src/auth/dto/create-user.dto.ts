import { UserRole } from '@prisma/client'
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator'

export class CreateUserDto {
	@IsOptional()
	@IsEmail({}, { message: 'Пожалуйста, введите корректный email.' })
	email?: string

	@IsOptional()
	@IsString({ message: 'Пароль должен быть строкой.' })
	@MinLength(6, { message: 'Пароль должен содержать не менее 6 символов.' })
	password?: string

	@IsOptional()
	@IsString({ message: 'Имя пользователя должно быть строкой.' })
	@MinLength(3, {
		message: 'Имя пользователя должно содержать не менее 3 символов.',
	})
	username?: string

	@IsEnum(UserRole, { message: 'Указана неверная роль пользователя.' })
	@IsNotEmpty({ message: 'Роль пользователя не должна быть пустой.' })
	role: UserRole

	@IsString({ message: 'Telegram User ID должен быть строкой.' })
	@IsNotEmpty({ message: 'Telegram User ID не должен быть пустым.' })
	telegramUserId: string
}
