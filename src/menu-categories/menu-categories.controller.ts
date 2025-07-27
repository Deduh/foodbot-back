import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Patch,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common'
import { MenuCategory } from '@prisma/client'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RequestWithJwtUser } from 'src/auth/types/auth.types'
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto'
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto'
import { MenuCategoriesService } from './menu-categories.service'

@Controller('menu-categories')
@UseGuards(JwtAuthGuard)
export class MenuCategoriesController {
	constructor(private readonly menuCategoriesService: MenuCategoriesService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() createMenuCategoryDto: CreateMenuCategoryDto,
		@Request() req: RequestWithJwtUser
	): Promise<MenuCategory> {
		return this.menuCategoriesService.create(createMenuCategoryDto, req.user)
	}

	@Get('restaurant/:restaurantId')
	async findAllByRestaurant(
		@Param('restaurantId', new ParseUUIDPipe({ version: '4' }))
		restaurantId: string,
		@Request() req: RequestWithJwtUser
	): Promise<MenuCategory[]> {
		return this.menuCategoriesService.findAllByRestaurant(
			restaurantId,
			req.user
		)
	}

	@Get(':id')
	async findOne(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Request() req: RequestWithJwtUser
	): Promise<MenuCategory> {
		return this.menuCategoriesService.findOne(id, req.user)
	}

	@Patch(':id')
	async update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateMenuCategoryDto: UpdateMenuCategoryDto,
		@Request() req: RequestWithJwtUser
	): Promise<MenuCategory> {
		return this.menuCategoriesService.update(
			id,
			updateMenuCategoryDto,
			req.user
		)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Request() req: RequestWithJwtUser
	): Promise<void> {
		await this.menuCategoriesService.remove(id, req.user)
	}
}
