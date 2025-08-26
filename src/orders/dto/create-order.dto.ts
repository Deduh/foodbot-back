import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested,
} from "class-validator"

class OrderItemDto {
	@ApiProperty({
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
		description: "ID блюда",
	})
	@IsUUID("4")
	@IsNotEmpty()
	menuItemId: string

	@ApiProperty({
		example: "2",
		description: "Количество",
	})
	@IsNumber()
	@Min(1)
	quantity: number
}

export class CreateOrderDto {
	@ApiProperty({
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
		description: "ID ресторана",
	})
	@IsUUID("4")
	@IsNotEmpty()
	restaurantId: string

	@ApiProperty({
		example: "Иванов Иван",
		description: "Имя заказчика",
	})
	@IsString()
	@IsNotEmpty()
	customerName: string

	@ApiProperty({
		example: "+7(999)999-99-99",
		description: "Номер телефона заказчика",
	})
	@IsString()
	@IsNotEmpty()
	customerPhone: string

	@ApiProperty({
		example: "улица Ленина, 123",
		description: "Адрес доставки",
	})
	@IsString()
	@IsNotEmpty()
	deliveryAddress: string

	@ApiProperty({
		example: "Уберите соус",
		description: "Комментарий к заказу",
	})
	@IsOptional()
	@IsString()
	customerComment?: string

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => OrderItemDto)
	items: OrderItemDto[]
}
