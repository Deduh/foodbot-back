import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common"
import { Prisma, Restaurant } from "@prisma/client"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateRestaurantDto } from "./dto/create-restaurant.dto"
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto"
import { RestaurantWithOwner } from "./types/restaurants.types"

@Injectable()
export class RestaurantsService {
	constructor(private prisma: PrismaService) {}

	async create(createRestaurantDto: CreateRestaurantDto): Promise<Restaurant> {
		const { ownerId, ...restaurantData } = createRestaurantDto

		try {
			const newRestaurant = await this.prisma.restaurant.create({
				data: {
					...restaurantData,
					owners: {
						connect: {
							id: ownerId,
						},
					},
				},
			})

			return newRestaurant
		} catch (error) {
			console.error("Error creating restaurant in service:", error)
			throw new InternalServerErrorException("Не удалось создать ресторан.")
		}
	}

	async findAll(): Promise<Restaurant[]> {
		return this.prisma.restaurant.findMany()
	}

	async findOne(id: string): Promise<RestaurantWithOwner> {
		const restaurant = await this.prisma.restaurant.findUnique({
			where: { id },
			include: {
				owners: true,
			},
		})

		if (!restaurant) {
			throw new NotFoundException(`Ресторан с ID "${id}" не найден.`)
		}

		return restaurant
	}

	async update(
		id: string,
		updateRestaurantDto: UpdateRestaurantDto
	): Promise<RestaurantWithOwner> {
		try {
			return await this.prisma.restaurant.update({
				where: { id },
				data: updateRestaurantDto,
				include: {
					owners: true,
				},
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				throw new NotFoundException(
					`Ресторан с ID "${id}" для обновления не найден.`
				)
			}
			console.error(
				`Error updating restaurant with ID ${id} in service:`,
				error
			)

			throw new InternalServerErrorException("Не удалось обновить ресторан.")
		}
	}

	async remove(id: string): Promise<Restaurant> {
		try {
			return await this.prisma.restaurant.delete({
				where: { id },
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				throw new NotFoundException(
					`Ресторан с ID "${id}" для удаления не найден.`
				)
			}

			console.error(
				`Error deleting restaurant with ID ${id} in service:`,
				error
			)

			throw new InternalServerErrorException("Не удалось удалить ресторан.")
		}
	}

	async getFullMenu(restaurantId: string) {
		return this.prisma.menuCategory.findMany({
			where: {
				restaurantId: restaurantId,
				isActive: true,
			},
			orderBy: {
				displayOrder: "asc",
			},
			include: {
				items: {
					where: {
						isActive: true,
					},
					orderBy: {
						displayOrder: "asc",
					},
				},
			},
		})
	}
}
