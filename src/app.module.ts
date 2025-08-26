import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { EventEmitterModule } from "@nestjs/event-emitter"
import { AdminBotModule } from "./admin-bot/admin-bot.module"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { AuthModule } from "./auth/auth.module"
import { BotInstancesModule } from "./bot-instances/bot-instances.module"
import { BotLaunchModule } from "./bot-launch/bot-launch.module"
import { configSchema } from "./config/config.schema"
import { EncryptionModule } from "./encryption/encryption.module"
import { MenuCategoriesModule } from "./menu-categories/menu-categories.module"
import { MenuItemsModule } from "./menu-items/menu-items.module"
import { OrdersModule } from "./orders/orders.module"
import { PrismaModule } from "./prisma/prisma.module"
import { RestaurantBotModule } from "./restaurant-bot/restaurant-bot.module"
import { RestaurantsModule } from "./restaurants/restaurants.module"
import { UsersModule } from "./users/users.module"

@Module({
	imports: [
		EventEmitterModule.forRoot(),
		ConfigModule.forRoot({
			isGlobal: true,
			validate: env => configSchema.parse(env),
			envFilePath: ".env",
		}),
		PrismaModule,
		UsersModule,
		AuthModule,
		RestaurantsModule,
		BotInstancesModule,
		MenuCategoriesModule,
		MenuItemsModule,
		OrdersModule,
		AdminBotModule,
		RestaurantBotModule,
		BotLaunchModule,
		EncryptionModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
