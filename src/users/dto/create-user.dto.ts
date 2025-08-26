import { UserRole } from "@prisma/client"
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator"

export class CreateUserDto {
	@IsString()
	@IsNotEmpty()
	telegramUserId: string

	@IsOptional()
	@IsString()
	username?: string

	@IsEnum(UserRole)
	role: UserRole
}
