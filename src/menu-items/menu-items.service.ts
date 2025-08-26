import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateMenuItemDto } from "./dto/create-menu-item.dto"
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto"

@Injectable()
export class MenuItemsService {
	private readonly logger = new Logger(MenuItemsService.name)

	constructor(private prisma: PrismaService) {}

	async create(dto: CreateMenuItemDto, ownerId: string) {
		const category = await this.prisma.menuCategory.findUnique({
			where: { id: dto.categoryId },
			include: {
				restaurant: {
					include: {
						owners: true,
					},
				},
			},
		})

		if (!category) {
			throw new NotFoundException("Категория меню не найдена.")
		}

		const isOwner = category.restaurant.owners.some(
			owner => owner.id === ownerId
		)

		if (!isOwner) {
			throw new ForbiddenException(
				"У вас нет прав на добавление блюда в эту категорию."
			)
		}

		const maxDisplayOrder = await this.prisma.menuItem.aggregate({
			_max: {
				displayOrder: true,
			},
			where: {
				categoryId: dto.categoryId,
			},
		})

		const nextDisplayOrder = (maxDisplayOrder._max.displayOrder ?? -1) + 1

		return this.prisma.menuItem.create({
			data: {
				name: dto.name,
				description: dto.description,
				price: dto.price,
				imageUrl: dto.imageUrl,
				categoryId: dto.categoryId,
				displayOrder: nextDisplayOrder,
			},
		})
	}

	async findAllByCategory(categoryId: string, ownerId: string) {
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
			throw new ForbiddenException("У вас нет прав на просмотр этих блюд.")
		}

		return this.prisma.menuItem.findMany({
			where: { categoryId },
			orderBy: {
				displayOrder: "asc",
			},
		})
	}

	async update(itemId: string, dto: UpdateMenuItemDto, ownerId: string) {
		const item = await this.prisma.menuItem.findUnique({
			where: { id: itemId },
			include: {
				category: { include: { restaurant: { include: { owners: true } } } },
			},
		})

		if (!item) {
			throw new NotFoundException("Блюдо не найдено.")
		}

		const isOwner = item.category.restaurant.owners.some(
			owner => owner.id === ownerId
		)

		if (!isOwner) {
			throw new ForbiddenException("У вас нет прав на изменение этого блюда.")
		}

		return this.prisma.menuItem.update({
			where: { id: itemId },
			data: dto,
		})
	}

	async remove(itemId: string, ownerId: string) {
		const item = await this.prisma.menuItem.findUnique({
			where: { id: itemId },
			include: {
				category: { include: { restaurant: { include: { owners: true } } } },
			},
		})

		if (!item) {
			throw new NotFoundException("Блюдо не найдено.")
		}

		const isOwner = item.category.restaurant.owners.some(
			owner => owner.id === ownerId
		)

		if (!isOwner) {
			throw new ForbiddenException("У вас нет прав на удаление этого блюда.")
		}

		return this.prisma.menuItem.delete({
			where: { id: itemId },
		})
	}
}
