import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateMenuCategoryDto } from "./dto/create-menu-category.dto"
import { UpdateMenuCategoryDto } from "./dto/update-menu-category.dto"

@Injectable()
export class MenuCategoriesService {
	constructor(private prisma: PrismaService) {}

	async create(dto: CreateMenuCategoryDto, ownerId: string) {
		const restaurant = await this.prisma.restaurant.findUnique({
			where: { id: dto.restaurantId },
			include: { owners: true },
		})

		if (!restaurant) {
			throw new NotFoundException("Ресторан не найден.")
		}

		const isOwner = restaurant.owners.some(owner => owner.id === ownerId)

		if (!isOwner) {
			throw new ForbiddenException(
				"У вас нет прав на добавление категории в этот ресторан."
			)
		}

		const maxDisplayOrder = await this.prisma.menuCategory.aggregate({
			_max: {
				displayOrder: true,
			},
			where: {
				restaurantId: dto.restaurantId,
			},
		})

		const nextDisplayOrder = (maxDisplayOrder._max.displayOrder ?? -1) + 1

		return this.prisma.menuCategory.create({
			data: {
				name: dto.name,
				restaurantId: dto.restaurantId,
				displayOrder: nextDisplayOrder,
			},
		})
	}

	async findAllByRestaurant(restaurantId: string, ownerId: string) {
		const restaurant = await this.prisma.restaurant.findUnique({
			where: { id: restaurantId },
			include: { owners: true },
		})

		if (!restaurant) {
			throw new NotFoundException("Ресторан не найден.")
		}

		const isOwner = restaurant.owners.some(owner => owner.id === ownerId)

		if (!isOwner) {
			throw new ForbiddenException("У вас нет прав на просмотр этого меню.")
		}

		return this.prisma.menuCategory.findMany({
			where: { restaurantId },
		})
	}

	async update(
		categoryId: string,
		dto: UpdateMenuCategoryDto,
		ownerId: string
	) {
		const category = await this.prisma.menuCategory.findUnique({
			where: { id: categoryId },
			include: { restaurant: { include: { owners: true } } },
		})

		if (!category) {
			throw new NotFoundException("Категория не найдена.")
		}

		const isOwner = category.restaurant.owners.some(
			owner => owner.id === ownerId
		)

		if (!isOwner) {
			throw new ForbiddenException(
				"У вас нет прав на изменение этой категории."
			)
		}

		return this.prisma.menuCategory.update({
			where: { id: categoryId },
			data: dto,
		})
	}

	async remove(categoryId: string, ownerId: string) {
		const category = await this.prisma.menuCategory.findUnique({
			where: { id: categoryId },
			include: { restaurant: { include: { owners: true } } },
		})

		if (!category) {
			throw new NotFoundException("Категория не найдена.")
		}

		const isOwner = category.restaurant.owners.some(
			owner => owner.id === ownerId
		)

		if (!isOwner) {
			throw new ForbiddenException("У вас нет прав на удаление этой категории.")
		}

		return this.prisma.menuCategory.delete({
			where: { id: categoryId },
		})
	}
}
