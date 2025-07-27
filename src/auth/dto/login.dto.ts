import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
	@IsEmail({}, { message: 'Пожалуйста, введите корректный email.' })
	@IsNotEmpty({ message: 'Email не должен быть пустым.' })
	email: string

	@IsString({ message: 'Пароль должен быть строкой.' })
	@IsNotEmpty({ message: 'Пароль не должен быть пустым.' })
	@MinLength(6, { message: 'Пароль должен содержать не менее 6 символов.' })
	password: string
}
