import {
	Body,
	Controller,
	Get,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Request,
	UseGuards,
} from "@nestjs/common"
import { UserRole } from "@prisma/client"
import { Roles } from "src/auth/decorators/roles.decorator"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { RolesGuard } from "src/auth/guards/roles.guard"
import { RequestWithJwtUser } from "src/auth/types/auth.types"
import { CreateOrderDto } from "./dto/create-order.dto"
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto"
import { OrdersService } from "./orders.service"

@Controller("orders")
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Post()
	@UseGuards(JwtAuthGuard)
	async create(
		@Body() dto: CreateOrderDto,
		@Request() req: RequestWithJwtUser
	) {
		const customer = req.user

		return this.ordersService.create(dto, customer)
	}

	@Get("by-restaurant/:restaurantId")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async findAllByRestaurant(
		@Param("restaurantId", new ParseUUIDPipe()) restaurantId: string,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.ordersService.findAllByRestaurant(restaurantId, ownerId)
	}

	@Patch(":id/status")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async updateStatus(
		@Param("id", new ParseUUIDPipe()) orderId: string,
		@Body() dto: UpdateOrderStatusDto,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.ordersService.updateStatus(orderId, dto, ownerId)
	}
}
