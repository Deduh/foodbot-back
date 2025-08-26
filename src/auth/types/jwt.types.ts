import { UserRole } from "@prisma/client"

export interface JwtPayload {
	sub: string
	telegramUserId: string
	role: UserRole
	restaurantId: string | null
}

export interface AuthenticatedUser {
	userId: string
	telegramUserId: string
	role: UserRole
	restaurantId: string | null
}
