import { Type } from 'class-transformer'
import {
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator'
import { CreateOrderItemDto } from './create-order-item.dto'

export class CreateOrderDto {
	@IsString({ message: 'Имя клиента должно быть строкой.' })
	@IsNotEmpty({ message: 'Имя клиента не должно быть пустым.' })
	customerName: string

	@IsString({ message: 'Телефон клиента должен быть строкой.' })
	@IsNotEmpty({ message: 'Телефон клиента не должен быть пустым.' })
	customerPhone: string

	@IsString({ message: 'Адрес доставки должен быть строкой.' })
	@IsNotEmpty({ message: 'Адрес доставки не должен быть пустым.' })
	deliveryAddress: string

	@IsOptional()
	@IsString()
	customerComment?: string

	@IsOptional()
	@IsString()
	customerTelegramUserId?: string

	@IsUUID('4', { message: 'restaurantId должен быть валидным UUID.' })
	@IsNotEmpty({ message: 'restaurantId не должен быть пустым.' })
	restaurantId: string

	@IsArray({ message: 'Позиции заказа должны быть массивом.' })
	@ValidateNested({
		each: true,
		message: 'Каждая позиция заказа должна быть валидным объектом.',
	})
	@Type(() => CreateOrderItemDto)
	@IsNotEmpty({ message: 'Заказ должен содержать хотя бы одну позицию.' })
	items: CreateOrderItemDto[]
}
