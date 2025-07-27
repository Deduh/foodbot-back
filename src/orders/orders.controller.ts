import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common'
import { Order } from '@prisma/client'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RequestWithJwtUser } from 'src/auth/types/auth.types'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	// TODO: Сделать защиту, чтобы не было спама заказов
	@Post()
	@HttpCode(HttpStatus.CREATED)
	async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
		return this.ordersService.createOrder(createOrderDto)
	}

	@Get('restaurant/:restaurantId')
	@UseGuards(JwtAuthGuard)
	async findOrdersByRestaurant(
		@Param('restaurantId', new ParseUUIDPipe({ version: '4' }))
		restaurantId: string,
		@Request() req: RequestWithJwtUser
	): Promise<Order[]> {
		return this.ordersService.findOrdersByRestaurant(restaurantId, req.user)
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard)
	async findOrderById(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Request() req: RequestWithJwtUser
	): Promise<Order> {
		return this.ordersService.findOrderById(id, req.user)
	}

	@Patch(':id/status')
	@UseGuards(JwtAuthGuard)
	async updateOrderStatus(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateOrderStatusDto: UpdateOrderStatusDto,
		@Request() req: RequestWithJwtUser
	): Promise<Order> {
		return this.ordersService.updateOrderStatus(
			id,
			updateOrderStatusDto,
			req.user
		)
	}
}
