import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { MenuCategory, UserRole } from '@prisma/client'
import { AuthenticatedUser } from 'src/auth/types/jwt.types'
import { PrismaService } from 'src/prisma/prisma.service'
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto'
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto'

@Injectable()
export class MenuCategoriesService {
	constructor(private prisma: PrismaService) {}

	async create(
		createDto: CreateMenuCategoryDto,
		user: AuthenticatedUser
	): Promise<MenuCategory> {
		let restaurantIdForDb: string

		if (user.role === UserRole.ADMIN) {
			if (!createDto.restaurantId) {
				throw new BadRequestException(
					'ADMIN должен указать restaurantId для создания категории.'
				)
			}

			restaurantIdForDb = createDto.restaurantId

			const restaurantExists = await this.prisma.restaurant.findUnique({
				where: { id: restaurantIdForDb },
			})

			if (!restaurantExists) {
				throw new NotFoundException(
					`Ресторан с ID "${restaurantIdForDb}" не найден.`
				)
			}
		} else if (user.role === UserRole.RESTAURANT_OWNER) {
			if (!user.restaurantId) {
				throw new ForbiddenException(
					'Владелец ресторана не привязан к ресторану.'
				)
			}

			if (
				createDto.restaurantId &&
				createDto.restaurantId !== user.restaurantId
			) {
				throw new ForbiddenException(
					'Вы не можете создавать категории для чужого ресторана.'
				)
			}

			restaurantIdForDb = user.restaurantId
		} else {
			throw new ForbiddenException(
				'У вас нет прав для создания категорий меню.'
			)
		}

		try {
			return await this.prisma.menuCategory.create({
				data: {
					name: createDto.name,
					displayOrder: createDto.displayOrder,
					isActive: createDto.isActive,
					restaurantId: restaurantIdForDb,
				},
			})
		} catch (error) {
			console.error('Error creating menu category:', error)
			throw new InternalServerErrorException(
				'Не удалось создать категорию меню.'
			)
		}
	}

	async findAllByRestaurant(
		restaurantId: string,
		user: AuthenticatedUser
	): Promise<MenuCategory[]> {
		if (user.role === UserRole.RESTAURANT_OWNER) {
			if (!user.restaurantId || user.restaurantId !== restaurantId) {
				throw new ForbiddenException(
					'Вы можете просматривать категории только своего ресторана.'
				)
			}
		} else if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException(
				'У вас нет прав для просмотра этих категорий.'
			)
		}

		const restaurantExists = await this.prisma.restaurant.findUnique({
			where: { id: restaurantId },
		})

		if (!restaurantExists) {
			throw new NotFoundException(`Ресторан с ID "${restaurantId}" не найден.`)
		}

		return this.prisma.menuCategory.findMany({
			where: { restaurantId },
			orderBy: { displayOrder: 'asc' },
		})
	}

	async findOne(
		categoryId: string,
		user: AuthenticatedUser
	): Promise<MenuCategory> {
		const category = await this.prisma.menuCategory.findUnique({
			where: { id: categoryId },
		})

		if (!category) {
			throw new NotFoundException(
				`Категория меню с ID "${categoryId}" не найдена.`
			)
		}

		if (user.role === UserRole.RESTAURANT_OWNER) {
			if (!user.restaurantId || category.restaurantId !== user.restaurantId) {
				throw new ForbiddenException(
					'Вы можете просматривать категории только своего ресторана.'
				)
			}
		} else if (user.role !== UserRole.ADMIN) {
			throw new ForbiddenException(
				'У вас нет прав для просмотра этой категории.'
			)
		}

		return category
	}

	async update(
		categoryId: string,
		updateDto: UpdateMenuCategoryDto,
		user: AuthenticatedUser
	): Promise<MenuCategory> {
		await this.findOne(categoryId, user)

		try {
			return await this.prisma.menuCategory.update({
				where: { id: categoryId },
				data: {
					name: updateDto.name,
					displayOrder: updateDto.displayOrder,
					isActive: updateDto.isActive,
				},
			})
		} catch (error) {
			console.error(`Error updating menu category ${categoryId}:`, error)
			throw new InternalServerErrorException(
				'Не удалось обновить категорию меню.'
			)
		}
	}

	async remove(
		categoryId: string,
		user: AuthenticatedUser
	): Promise<MenuCategory> {
		await this.findOne(categoryId, user)

		try {
			return await this.prisma.menuCategory.delete({
				where: { id: categoryId },
			})
		} catch (error) {
			console.error(`Error deleting menu category ${categoryId}:`, error)
			throw new InternalServerErrorException(
				'Не удалось удалить категорию меню.'
			)
		}
	}
}
