import { Module } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { TelegrafModule } from "nestjs-telegraf"
import { BotInstancesModule } from "src/bot-instances/bot-instances.module"
import { RestaurantsModule } from "src/restaurants/restaurants.module"
import { UsersModule } from "src/users/users.module"
import { session } from "telegraf"
import { AdminBotService } from "./admin-bot.service"
import { AdminBotKeyboardsService } from "./keyboards/admin-bot.keyboards.service"
import { CreateRestaurantScene } from "./scenes/create-restaurant.scene"

@Module({
	imports: [
		UsersModule,
		RestaurantsModule,
		BotInstancesModule,
		TelegrafModule.forRootAsync({
			botName: "admin",
			useFactory: (configService: ConfigService) => ({
				token: configService.get<string>("ADMIN_BOT_TOKEN")!,
				middlewares: [session()],
				include: [AdminBotModule],
			}),
			inject: [ConfigService],
		}),
	],
	providers: [AdminBotService, CreateRestaurantScene, AdminBotKeyboardsService],
	exports: [AdminBotService, CreateRestaurantScene, AdminBotKeyboardsService],
})
export class AdminBotModule {}
