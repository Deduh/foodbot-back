import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { BotInstancesModule } from './bot-instances/bot-instances.module'
import { MenuCategoriesModule } from './menu-categories/menu-categories.module'
import { MenuItemsModule } from './menu-items/menu-items.module'
import { OrdersModule } from './orders/orders.module'
import { PrismaModule } from './prisma/prisma.module'
import { RestaurantsModule } from './restaurants/restaurants.module'
import { UsersModule } from './users/users.module'
import { AdminBotModule } from './admin-bot/admin-bot.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		PrismaModule,
		UsersModule,
		AuthModule,
		RestaurantsModule,
		BotInstancesModule,
		MenuCategoriesModule,
		MenuItemsModule,
		OrdersModule,
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => {
				const botToken = configService.get<string>('ADMIN_BOT_TOKEN')

				if (!botToken) {
					throw new Error(
						'ADMIN_BOT_TOKEN не определен в переменных окружения!'
					)
				}

				return {
					token: botToken,
				}
			},
			inject: [ConfigService],
		}),
		AdminBotModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
