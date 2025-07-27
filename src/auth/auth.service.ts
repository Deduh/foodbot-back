import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { UsersService } from 'src/users/users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { JwtPayload } from './types/jwt.types'

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService
	) {}

	async validateUser(
		email: string,
		pass: string
	): Promise<Omit<User, 'passwordHash'> | null> {
		if (!email) {
			return null
		}

		const user = await this.usersService.findOneByEmail(email)

		if (
			user &&
			user.passwordHash &&
			(await bcrypt.compare(pass, user.passwordHash))
		) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { passwordHash, ...result } = user
			return result
		}

		return null
	}

	login(user: Omit<User, 'passwordHash'>) {
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			restaurantId:
				user.role === UserRole.RESTAURANT_OWNER ? user.restaurantId : null,
		}

		return {
			access_token: this.jwtService.sign(payload),
		}
	}

	async register(
		createUserDto: CreateUserDto
	): Promise<{ user: Omit<User, 'passwordHash'>; access_token: string }> {
		try {
			const newUser = await this.usersService.createUser({
				email: createUserDto.email,
				passwordPlainText: createUserDto.password,
				role: createUserDto.role,
				username: createUserDto.username,
				telegramUserId: createUserDto.telegramUserId,
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { passwordHash, ...userResult } = newUser

			const tokenPayload = this.login(userResult)

			return {
				user: userResult,
				access_token: tokenPayload.access_token,
			}
		} catch (error) {
			if (
				error instanceof Error &&
				typeof error.message === 'string' &&
				error.message.includes('уже существует')
			) {
				throw new ConflictException(error.message)
			}

			console.error('Error during registration in AuthService:', error)

			throw new InternalServerErrorException(
				'Не удалось зарегистрировать пользователя.'
			)
		}
	}
}
