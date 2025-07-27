import { IsBoolean, IsOptional, IsString } from 'class-validator'

export class UpdateBotInstanceDto {
	@IsOptional()
	@IsBoolean({ message: 'Статус активности должен быть булевым значением.' })
	isActive?: boolean

	@IsOptional()
	@IsString({ message: 'Приветственное сообщение должно быть строкой.' })
	welcomeMessage?: string

	@IsOptional()
	@IsString({ message: 'URL логотипа должен быть строкой.' })
	logoUrl?: string
}
