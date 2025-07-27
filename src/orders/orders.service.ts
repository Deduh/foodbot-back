import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from '@nestjs/common'
import { Order, OrderStatus, Prisma, User, UserRole } from '@prisma/client'
import { AuthenticatedUser } from 'src/auth/types/jwt.types'
import { MenuItemsService } from 'src/menu-items/menu-items.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { UsersService } from 'src/users/users.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name)

	constructor(
		private prisma: PrismaService,
		private usersService: UsersService,
		private menuItemsService: MenuItemsService
	) {}

	async createOrder(dto: CreateOrderDto): Promise<Order> {
		const restaurant = await this.prisma.restaurant.findUnique({
			where: { id: dto.restaurantId },
		})

		if (!restaurant) {
			throw new NotFoundException(
				`Ресторан с ID "${dto.restaurantId}" не найден.`
			)
		}

		if (!restaurant.isActive) {
			throw new BadRequestException(
				`Ресторан "${restaurant.name}" в данный момент не принимает заказы.`
			)
		}

		let customerUser: User | null = null

		if (dto.customerTelegramUserId) {
			customerUser = await this.usersService.findOneByTelegramUserId(
				dto.customerTelegramUserId
			)

			if (!customerUser) {
				try {
					customerUser = await this.usersService.createUser({
						telegramUserId: dto.customerTelegramUserId,
						role: UserRole.CUSTOMER,
					})

					this.logger.log(
						`Silently registered new customer: ${customerUser.id} (TG: ${dto.customerTelegramUserId})`
					)
				} catch (error) {
					this.logger.error(
						`Failed to silently register customer with TG ID ${dto.customerTelegramUserId}`,
						error instanceof Error ? error.stack : error
					)

					customerUser = null
				}
			}
		}

		if (!dto.items || dto.items.length === 0) {
			throw new BadRequestException(
				'Заказ должен содержать хотя бы одну позицию.'
			)
		}

		let orderTotalPrice = new Prisma.Decimal(0)
		const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = []

		for (const itemDto of dto.items) {
			const menuItem = await this.prisma.menuItem.findUnique({
				where: { id: itemDto.menuItemId },
				include: { category: true },
			})

			if (!menuItem) {
				throw new NotFoundException(
					`Позиция меню с ID "${itemDto.menuItemId}" не найдена.`
				)
			}

			if (!menuItem.isActive) {
				throw new BadRequestException(
					`Позиция меню "${menuItem.name}" в данный момент недоступна для заказа.`
				)
			}

			if (menuItem.category.restaurantId !== dto.restaurantId) {
				throw new BadRequestException(
					`Позиция меню "${menuItem.name}" не принадлежит ресторану с ID "${dto.restaurantId}".`
				)
			}

			const itemPriceAtOrder = menuItem.price
			const itemTotalPrice = new Prisma.Decimal(itemDto.quantity).mul(
				itemPriceAtOrder
			)

			orderItemsData.push({
				menuItemId: itemDto.menuItemId,
				quantity: itemDto.quantity,
				priceAtOrder: itemPriceAtOrder,
				totalPrice: itemTotalPrice,
			})

			orderTotalPrice = orderTotalPrice.add(itemTotalPrice)
		}

		try {
			const createdOrder = await this.prisma.order.create({
				data: {
					customerName: dto.customerName,
					customerPhone: dto.customerPhone,
					deliveryAddress: dto.deliveryAddress,
					customerComment: dto.customerComment,
					customerTelegramUserId: dto.customerTelegramUserId,
					totalPrice: orderTotalPrice,
					status: OrderStatus.PENDING,
					restaurantId: dto.restaurantId,
					userId: customerUser?.id,
					items: {
						createMany: {
							data: orderItemsData,
						},
					},
				},
				include: {
					items: true,
					restaurant: { select: { name: true } },
				},
			})

			this.logger.log(
				`New order created: ${createdOrder.id} for restaurant ${restaurant.name}`
			)

			return createdOrder
		} catch (error) {
			this.logger.error(
				`Failed to create order in DB: ${String(error)}`,
				error instanceof Error ? error.stack : undefined
			)
			throw new InternalServerErrorException('Не удалось создать заказ.')
		}
	}

	async findOrdersByRestaurant(
		restaurantId: string,
		user: AuthenticatedUser
	): Promise<Order[]> {
		if (
			user.role === UserRole.RESTAURANT_OWNER &&
			user.restaurantId !== restaurantId
		) {
			throw new ForbiddenException(
				'Вы можете просматривать заказы только своего ресторана.'
			)
		}

		const restaurantExists = await this.prisma.restaurant.findUnique({
			where: { id: restaurantId },
		})

		if (!restaurantExists) {
			throw new NotFoundException(`Ресторан с ID "${restaurantId}" не найден.`)
		}

		return this.prisma.order.findMany({
			where: { restaurantId },
			orderBy: { createdAt: 'desc' },
			include: { items: { include: { menuItem: { select: { name: true } } } } },
		})
	}

	async findOrderById(
		orderId: string,
		user: AuthenticatedUser
	): Promise<Order> {
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			include: {
				items: { include: { menuItem: { select: { name: true } } } },
				restaurant: { select: { name: true } },
			},
		})

		if (!order) {
			throw new NotFoundException(`Заказ с ID "${orderId}" не найден.`)
		}

		if (
			user.role === UserRole.RESTAURANT_OWNER &&
			user.restaurantId !== order.restaurantId
		) {
			throw new ForbiddenException(
				'Вы можете просматривать только заказы своего ресторана.'
			)
		}

		// TODO: В будущем сделать просмотр заказов для клиентов
		// if (user.role === UserRole.CUSTOMER && order.userId !== user.userId) {
		//   throw new ForbiddenException('Вы можете просматривать только свои заказы.');
		// }

		if (
			user.role !== UserRole.ADMIN &&
			user.role !== UserRole.RESTAURANT_OWNER
		) {
			throw new ForbiddenException('У вас нет прав для просмотра этого заказа.')
		}

		return order
	}

	async updateOrderStatus(
		orderId: string,
		dto: UpdateOrderStatusDto,
		user: AuthenticatedUser
	): Promise<Order> {
		const orderToUpdate = await this.findOrderById(orderId, user)

		if (user.role === UserRole.RESTAURANT_OWNER) {
			const currentStatus = orderToUpdate.status
			const newStatus = dto.status

			if (currentStatus === newStatus) {
				throw new BadRequestException('Новый статус совпадает с текущим.')
			}

			const finalStatuses: OrderStatus[] = [
				OrderStatus.COMPLETED,
				OrderStatus.CANCELLED_BY_USER,
				OrderStatus.CANCELLED_BY_RESTAURANT,
			]

			if (finalStatuses.includes(currentStatus)) {
				throw new BadRequestException(
					`Заказ со статусом "${currentStatus}" не может быть изменен.`
				)
			}

			if (newStatus === OrderStatus.CANCELLED_BY_USER) {
				throw new ForbiddenException(
					'Статус "Отменен клиентом" не может быть установлен владельцем ресторана.'
				)
			}

			let isTransitionAllowed = false
			let allowedNextStatuses: OrderStatus[]

			switch (currentStatus) {
				case OrderStatus.PENDING:
					allowedNextStatuses = [
						OrderStatus.CONFIRMED,
						OrderStatus.CANCELLED_BY_RESTAURANT,
					]
					isTransitionAllowed = allowedNextStatuses.includes(newStatus)

					break
				case OrderStatus.CONFIRMED:
					allowedNextStatuses = [
						OrderStatus.PREPARING,
						OrderStatus.CANCELLED_BY_RESTAURANT,
					]
					isTransitionAllowed = allowedNextStatuses.includes(newStatus)

					break
				case OrderStatus.PREPARING:
					allowedNextStatuses = [
						OrderStatus.DELIVERING,
						OrderStatus.CANCELLED_BY_RESTAURANT,
					]
					isTransitionAllowed = allowedNextStatuses.includes(newStatus)

					break
				case OrderStatus.DELIVERING:
					allowedNextStatuses = [OrderStatus.COMPLETED]
					isTransitionAllowed = allowedNextStatuses.includes(newStatus)

					break
				case OrderStatus.COMPLETED:
				case OrderStatus.CANCELLED_BY_USER:
				case OrderStatus.CANCELLED_BY_RESTAURANT:
					isTransitionAllowed = false

					break
				default:
					isTransitionAllowed = false
					this.logger.warn(
						`Необработанный текущий статус заказа ${String(currentStatus)} при попытке перехода в ${newStatus}. Этот случай не должен достигаться.`
					)

					break
			}

			if (!isTransitionAllowed) {
				throw new BadRequestException(
					`Переход из статуса "${currentStatus}" в статус "${newStatus}" не разрешен для владельца ресторана.`
				)
			}
		}

		try {
			const updatedOrder = await this.prisma.order.update({
				where: { id: orderId },
				data: { status: dto.status },
				include: { items: true, restaurant: { select: { name: true } } },
			})

			this.logger.log(
				`Order ${orderId} status updated to ${dto.status} by user ${user.userId} (Role: ${user.role})`
			)

			// TODO: Отправка уведомления клиенту об изменении статуса заказа

			return updatedOrder
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2025'
			) {
				throw new NotFoundException(
					`Заказ с ID "${orderId}" для обновления не найден.`
				)
			}

			this.logger.error(
				`Failed to update status for order ${orderId}: ${String(error)}`,
				error instanceof Error ? error.stack : undefined
			)
			throw new InternalServerErrorException(
				'Не удалось обновить статус заказа.'
			)
		}
	}
}
