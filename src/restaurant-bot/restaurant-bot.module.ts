import { Module } from "@nestjs/common"
import { OrdersModule } from "src/orders/orders.module"
import { UsersModule } from "src/users/users.module"
import { RestaurantBotKeyboardsService } from "./keyboards/restaurant-bot.keyboards.service"
import { RestaurantBotUpdate } from "./update/restaurant-bot.update.service"

@Module({
	imports: [UsersModule, OrdersModule],
	providers: [RestaurantBotKeyboardsService, RestaurantBotUpdate],
	exports: [RestaurantBotUpdate, RestaurantBotKeyboardsService],
})
export class RestaurantBotModule {}
