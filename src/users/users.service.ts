import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { Prisma, User, UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateRestaurantOwnerDto } from './dto/create-restaurant-owner.dto'

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async createUser(userData: {
		email?: string | null
		passwordPlainText?: string | null
		role: UserRole
		telegramUserId: string
		username?: string
		isActive?: boolean
		restaurantId?: string | null
	}): Promise<User> {
		let passwordHash: string | null = null

		if (userData.passwordPlainText) {
			const saltRounds = 10
			passwordHash = await bcrypt.hash(userData.passwordPlainText, saltRounds)
		}

		if (userData.restaurantId) {
			const restaurantExists = await this.prisma.restaurant.findUnique({
				where: { id: userData.restaurantId },
			})

			if (!restaurantExists) {
				throw new NotFoundException(
					`Ресторан с ID "${userData.restaurantId}" не найден. Невозможно привязать пользователя.`
				)
			}
		}

		try {
			return await this.prisma.user.create({
				data: {
					email: userData.email,
					username: userData.username,
					passwordHash: passwordHash,
					role: userData.role,
					isActive: userData.isActive ?? true,
					telegramUserId: userData.telegramUserId,
					restaurantId: userData.restaurantId,
				},
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2002'
			) {
				let field = 'неизвестное поле'

				if (Array.isArray(error.meta?.target) && error.meta.target.length > 0) {
					field = error.meta.target.join(', ')
				} else if (typeof error.meta?.target === 'string') {
					field = error.meta.target
				}

				throw new InternalServerErrorException(
					`Пользователь с таким значением поля '${field}' уже существует (например, email или telegramUserId)`
				)
			}

			console.error('Error creating user:', error)

			throw new InternalServerErrorException(
				'Не удалось создать пользователя по неизвестной причине.'
			)
		}
	}

	async createRestaurantOwner(dto: CreateRestaurantOwnerDto): Promise<User> {
		return this.createUser({
			email: dto.email,
			passwordPlainText: dto.password,
			role: UserRole.RESTAURANT_OWNER,
			telegramUserId: dto.telegramUserId,
			username: dto.username,
			restaurantId: dto.restaurantId,
			isActive: true,
		})
	}

	async findOneByEmail(email: string): Promise<User | null> {
		if (!email) return null

		return this.prisma.user.findUnique({
			where: { email },
		})
	}

	async findOneById(id: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { id },
		})
	}

	async findOneByTelegramUserId(telegramUserId: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { telegramUserId },
		})
	}
}
