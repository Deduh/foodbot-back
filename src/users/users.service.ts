import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common"
import { Prisma, Restaurant, User, UserRole } from "@prisma/client"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateRestaurantOwnerDto } from "./dto/create-restaurant-owner.dto"
import { CreateUserDto } from "./dto/create-user.dto"
import { UpdateUserDto } from "./dto/update-user.dto"
import { UserWithRestaurant } from "./types/users.types"

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		return this.createUser({
			telegramUserId: createUserDto.telegramUserId,
			username: createUserDto.username,
			role: createUserDto.role,
		})
	}

	async findAll(): Promise<User[]> {
		return this.prisma.user.findMany()
	}

	async findOneById(
		id: string
	): Promise<(User & { restaurant: Restaurant | null }) | null> {
		return this.prisma.user.findUnique({
			where: { id },
			include: {
				restaurant: true,
			},
		})
	}

	async update(
		id: string,
		updateUserDto: UpdateUserDto
	): Promise<UserWithRestaurant> {
		try {
			const updatedUser = await this.prisma.user.update({
				where: { id },
				data: updateUserDto,
				include: {
					restaurant: true,
				},
			})

			return updatedUser
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				throw new NotFoundException(
					`Пользователь с ID "${id}" для обновления не найден.`
				)
			}

			console.error(`Error updating user ${id}:`, error)

			throw new InternalServerErrorException(
				"Не удалось обновить пользователя."
			)
		}
	}

	async createUser(userData: {
		email?: string | null
		role: UserRole
		telegramUserId: string
		username?: string | null
		isActive?: boolean
		restaurantId?: string | null
	}): Promise<User> {
		if (userData.restaurantId) {
			const restaurantExists = await this.prisma.restaurant.findUnique({
				where: { id: userData.restaurantId },
			})
			if (!restaurantExists) {
				throw new NotFoundException(
					`Ресторан с ID "${userData.restaurantId}" не найден.`
				)
			}
		}

		try {
			return await this.prisma.user.create({
				data: {
					telegramUserId: userData.telegramUserId,
					email: userData.email,
					username: userData.username,
					role: userData.role,
					isActive: userData.isActive ?? true,
					restaurantId: userData.restaurantId,
				},
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				let field = "неизвестное поле"

				if (Array.isArray(error.meta?.target) && error.meta.target.length > 0) {
					field = error.meta.target.join(", ")
				} else if (typeof error.meta?.target === "string") {
					field = error.meta.target
				}

				throw new InternalServerErrorException(
					`Пользователь с таким значением поля '${field}' уже существует (например, email или telegramUserId)`
				)
			}

			console.error("Error creating user:", error)

			throw new InternalServerErrorException(
				"Не удалось создать пользователя по неизвестной причине."
			)
		}
	}

	async createRestaurantOwner(dto: CreateRestaurantOwnerDto): Promise<User> {
		return this.createUser({
			telegramUserId: dto.telegramUserId,
			username: dto.username,
			email: dto.email,
			role: UserRole.RESTAURANT_OWNER,
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

	async findOneByTelegramUserId(telegramUserId: string): Promise<User | null> {
		return this.prisma.user.findUnique({
			where: { telegramUserId },
		})
	}
}
