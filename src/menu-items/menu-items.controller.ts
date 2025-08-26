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
} from "@nestjs/common"
import { UserRole } from "@prisma/client"
import { Roles } from "src/auth/decorators/roles.decorator"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { RolesGuard } from "src/auth/guards/roles.guard"
import { RequestWithJwtUser } from "src/auth/types/auth.types"
import { CreateMenuItemDto } from "./dto/create-menu-item.dto"
import { UpdateMenuItemDto } from "./dto/update-menu-item.dto"
import { MenuItemsService } from "./menu-items.service"

@Controller("menu-items")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuItemsController {
	constructor(private readonly menuItemsService: MenuItemsService) {}

	@Post()
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async create(
		@Body() dto: CreateMenuItemDto,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.menuItemsService.create(dto, ownerId)
	}

	@Get("by-category/:categoryId")
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async findAllByCategory(
		@Param("categoryId", new ParseUUIDPipe()) categoryId: string,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.menuItemsService.findAllByCategory(categoryId, ownerId)
	}

	@Patch(":id")
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async update(
		@Param("id", new ParseUUIDPipe()) itemId: string,
		@Body() dto: UpdateMenuItemDto,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.menuItemsService.update(itemId, dto, ownerId)
	}

	@Delete(":id")
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param("id", new ParseUUIDPipe()) itemId: string,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		await this.menuItemsService.remove(itemId, ownerId)
	}
}
