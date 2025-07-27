import { OrderStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty } from 'class-validator'

export class UpdateOrderStatusDto {
	@IsEnum(OrderStatus, { message: 'Недопустимое значение для статуса заказа.' })
	@IsNotEmpty({ message: 'Статус заказа не должен быть пустым.' })
	status: OrderStatus
}
