import { OrderStatus } from "@prisma/client"
import { IsEnum, IsNotEmpty } from "class-validator"

export class UpdateOrderStatusDto {
	@IsEnum(OrderStatus, { message: "Указан неверный статус заказа." })
	@IsNotEmpty()
	status: OrderStatus
}
