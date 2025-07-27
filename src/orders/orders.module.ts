import { Module } from '@nestjs/common'
import { MenuItemsModule } from 'src/menu-items/menu-items.module'
import { UsersModule } from 'src/users/users.module'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'

@Module({
	imports: [UsersModule, MenuItemsModule],
	providers: [OrdersService],
	controllers: [OrdersController],
	exports: [OrdersService],
})
export class OrdersModule {}
