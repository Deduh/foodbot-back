import {
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { MenuItem, Prisma, UserRole } from '@prisma/client'
import { AuthenticatedUser } from 'src/auth/types/jwt.types'
import { MenuCategoriesService } from 'src/menu-categories/menu-categories.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateMenuItemDto } from './dto/create-menu-item.dto'
import { UpdateMenuItemDto } from './dto/update-menu-item.dto'

@Injectable()
export class MenuItemsService {
	private readonly logger = new Logger(MenuItemsService.name)

	constructor(
		private prisma: PrismaService,
		private menuCategoriesService: MenuCategoriesService
	) {}

	async create(
		createDto: CreateMenuItemDto,
		user: AuthenticatedUser
	): Promise<MenuItem> {
		await this.menuCategoriesService.findOne(createDto.categoryId, user)

		try {
			const menuItem = await this.prisma.menuItem.create({
				data: {
					name: createDto.name,
					description: createDto.description,
					price: new Prisma.Decimal(createDto.price),
					imageUrl: createDto.imageUrl,
					displayOrder: createDto.displayOrder,
					isActive: createDto.isActive,
					categoryId: createDto.categoryId,
				},
			})

			return menuItem
		} catch (error) {
			this.logger.error(
				`Error creating menu item: ${String(error)}`,
				error instanceof Error ? error.stack : undefined
			)
			throw new InternalServerErrorException('Не удалось создать позицию меню.')
		}
	}

	async findAllByMenuCategory(
		categoryId: string,
		user: AuthenticatedUser
	): Promise<MenuItem[]> {
		await this.menuCategoriesService.findOne(categoryId, user)

		return this.prisma.menuItem.findMany({
			where: { categoryId },
			orderBy: { displayOrder: 'asc' },
		})
	}

	async findOne(itemId: string, user: AuthenticatedUser): Promise<MenuItem> {
		const menuItem = await this.prisma.menuItem.findUnique({
			where: { id: itemId },
			include: {
				category: {
					select: {
						id: true,
						restaurantId: true,
					},
				},
			},
		})

		if (!menuItem) {
			throw new NotFoundException(`Позиция меню с ID "${itemId}" не найдена.`)
		}

		if (user.role === UserRole.RESTAURANT_OWNER) {
			if (
				!user.restaurantId ||
				!menuItem.category ||
				menuItem.category.restaurantId !== user.restaurantId
			) {
				throw new ForbiddenException(
					'Вы можете просматривать позиции меню только своего ресторана.'
				)
			}
		} else if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException(
				'У вас нет прав для просмотра этой позиции меню.'
			)
		}

		return menuItem
	}

	async update(
		itemId: string,
		updateDto: UpdateMenuItemDto,
		user: AuthenticatedUser
	): Promise<MenuItem> {
		await this.findOne(itemId, user)

		try {
			const updateData: Prisma.MenuItemUpdateInput = { ...updateDto }

			if (updateDto.price !== undefined) {
				updateData.price = new Prisma.Decimal(updateDto.price)
			}

			return await this.prisma.menuItem.update({
				where: { id: itemId },
				data: updateData,
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2025'
			) {
				throw new NotFoundException(
					`Позиция меню с ID "${itemId}" для обновления не найдена.`
				)
			}

			this.logger.error(
				`Error updating menu item ${itemId}: ${String(error)}`,
				error instanceof Error ? error.stack : undefined
			)
			throw new InternalServerErrorException(
				'Не удалось обновить позицию меню.'
			)
		}
	}

	async remove(itemId: string, user: AuthenticatedUser): Promise<MenuItem> {
		await this.findOne(itemId, user)

		try {
			return await this.prisma.menuItem.delete({
				where: { id: itemId },
			})
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2025'
			) {
				throw new NotFoundException(
					`Позиция меню с ID "${itemId}" для удаления не найдена.`
				)
			}

			this.logger.error(
				`Error deleting menu item ${itemId}: ${String(error)}`,
				error instanceof Error ? error.stack : undefined
			)
			throw new InternalServerErrorException('Не удалось удалить позицию меню.')
		}
	}
}
