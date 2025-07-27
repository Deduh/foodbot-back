import { Type } from 'class-transformer'
import { IsNotEmpty, IsPositive, IsUUID, Min } from 'class-validator'

export class CreateOrderItemDto {
	@IsUUID('4', { message: 'menuItemId должен быть валидным UUID.' })
	@IsNotEmpty({ message: 'menuItemId не должен быть пустым.' })
	menuItemId: string

	@Type(() => Number)
	@IsPositive({ message: 'Количество должно быть положительным числом.' })
	@Min(1, { message: 'Минимальное количество для заказа - 1.' })
	@IsNotEmpty({ message: 'Количество не должно быть пустым.' })
	quantity: number
}
