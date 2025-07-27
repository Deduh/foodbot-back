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
import { MenuItem } from '@prisma/client'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RequestWithJwtUser } from 'src/auth/types/auth.types'
import { CreateMenuItemDto } from './dto/create-menu-item.dto'
import { UpdateMenuItemDto } from './dto/update-menu-item.dto'
import { MenuItemsService } from './menu-items.service'

@Controller('menu-items')
@UseGuards(JwtAuthGuard)
export class MenuItemsController {
	constructor(private readonly menuItemsService: MenuItemsService) {}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() createMenuItemDto: CreateMenuItemDto,
		@Request() req: RequestWithJwtUser
	): Promise<MenuItem> {
		return this.menuItemsService.create(createMenuItemDto, req.user)
	}

	@Get('category/:categoryId')
	async findAllByMenuCategory(
		@Param('categoryId', new ParseUUIDPipe({ version: '4' }))
		categoryId: string,
		@Request() req: RequestWithJwtUser
	): Promise<MenuItem[]> {
		return this.menuItemsService.findAllByMenuCategory(categoryId, req.user)
	}

	@Get(':id')
	async findOne(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Request() req: RequestWithJwtUser
	): Promise<MenuItem> {
		return this.menuItemsService.findOne(id, req.user)
	}

	@Patch(':id')
	async update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateMenuItemDto: UpdateMenuItemDto,
		@Request() req: RequestWithJwtUser
	): Promise<MenuItem> {
		return this.menuItemsService.update(id, updateMenuItemDto, req.user)
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Request() req: RequestWithJwtUser
	): Promise<void> {
		await this.menuItemsService.remove(id, req.user)
	}
}
