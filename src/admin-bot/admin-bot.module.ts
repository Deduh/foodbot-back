import { Module } from '@nestjs/common'
import { RestaurantsModule } from 'src/restaurants/restaurants.module'
import { UsersModule } from 'src/users/users.module'
import { AdminBotService } from './admin-bot.service'

@Module({
	imports: [UsersModule, RestaurantsModule],
	providers: [AdminBotService],
})
export class AdminBotModule {}
