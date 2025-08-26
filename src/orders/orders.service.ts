import {
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { AuthenticatedUser } from "src/auth/types/jwt.types"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateOrderDto } from "./dto/create-order.dto"
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto"

@Injectable()
export class OrdersService {
	private readonly logger = new Logger(OrdersService.name)

	constructor(
		private prisma: PrismaService,
		private eventEmitter: EventEmitter2
	) {}

	async create(dto: CreateOrderDto, customer: AuthenticatedUser) {
		const menuItemIds = dto.items.map(item => item.menuItemId)
		const menuItems = await this.prisma.menuItem.findMany({
			where: { id: { in: menuItemIds } },
		})

		if (menuItems.length !== menuItemIds.length) {
			throw new NotFoundException(
				"Одно или несколько блюд в заказе не найдены."
			)
		}

		let totalPrice = 0

		for (const item of dto.items) {
			const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
			totalPrice += Number(menuItem.price) * item.quantity
		}

		const order = await this.prisma.$transaction(async tx => {
			const createdOrder = await tx.order.create({
				data: {
					restaurantId: dto.restaurantId,
					totalPrice: totalPrice,
					customerName: dto.customerName,
					customerPhone: dto.customerPhone,
					deliveryAddress: dto.deliveryAddress,
					customerComment: dto.customerComment,
					userId: customer.userId,
					customerTelegramUserId: customer.telegramUserId,
				},
			})

			const orderItemsData = dto.items.map(item => {
				const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
				return {
					orderId: createdOrder.id,
					menuItemId: item.menuItemId,
					quantity: item.quantity,
					priceAtOrder: menuItem.price,
					totalPrice: Number(menuItem.price) * item.quantity,
				}
			})

			await tx.orderItem.createMany({
				data: orderItemsData,
			})

			return createdOrder
		})

		this.eventEmitter.emit("order.created", order)

		return order
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
		const isAdmin =
			(await this.prisma.user.findUnique({ where: { id: ownerId } }))?.role ===
			"ADMIN"

		if (!isOwner && !isAdmin) {
			throw new ForbiddenException(
				"У вас нет прав на просмотр заказов этого ресторана."
			)
		}

		return this.prisma.order.findMany({
			where: { restaurantId },
			orderBy: {
				createdAt: "desc",
			},
			include: {
				items: {
					include: {
						menuItem: true,
					},
				},
			},
		})
	}

	async updateStatus(
		orderId: string,
		dto: UpdateOrderStatusDto,
		ownerId: string
	) {
		const order = await this.prisma.order.findUnique({
			where: { id: orderId },
			include: { restaurant: { include: { owners: true } } },
		})

		if (!order) {
			throw new NotFoundException("Заказ не найден.")
		}

		const isOwner = order.restaurant.owners.some(owner => owner.id === ownerId)
		const user = await this.prisma.user.findUnique({ where: { id: ownerId } })
		const isAdmin = user?.role === "ADMIN"

		if (!isOwner && !isAdmin) {
			throw new ForbiddenException("У вас нет прав на изменение этого заказа.")
		}

		return this.prisma.order.update({
			where: { id: orderId },
			data: {
				status: dto.status,
			},
		})
	}
}
