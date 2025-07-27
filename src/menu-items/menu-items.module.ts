import { Module } from '@nestjs/common'
import { MenuCategoriesModule } from 'src/menu-categories/menu-categories.module'
import { MenuItemsController } from './menu-items.controller'
import { MenuItemsService } from './menu-items.service'

@Module({
	imports: [MenuCategoriesModule],
	providers: [MenuItemsService],
	controllers: [MenuItemsController],
	exports: [MenuItemsService],
})
export class MenuItemsModule {}
