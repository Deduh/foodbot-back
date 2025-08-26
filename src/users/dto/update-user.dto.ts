import { UserRole } from "@prisma/client"
import { IsBoolean, IsEnum, IsOptional } from "class-validator"

export class UpdateUserDto {
	@IsOptional()
	@IsBoolean()
	isActive?: boolean

	@IsOptional()
	@IsEnum(UserRole)
	role?: UserRole
}
