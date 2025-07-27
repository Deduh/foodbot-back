import { UserRole } from '@prisma/client'

export interface JwtPayload {
	sub: string
	email?: string | null
	role: UserRole
	restaurantId?: string | null
}

export interface AuthenticatedUser {
	userId: string
	email?: string | null
	role: UserRole
	restaurantId?: string | null
}
