import { User as UserModel } from '@prisma/client'
import { AuthenticatedUser } from './jwt.types'

export interface RequestWithLocalUser extends Express.Request {
	user: Omit<UserModel, 'passwordHash'>
}

export interface RequestWithJwtUser extends Express.Request {
	user: AuthenticatedUser
}
