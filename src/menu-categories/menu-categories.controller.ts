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
import { CreateMenuCategoryDto } from "./dto/create-menu-category.dto"
import { UpdateMenuCategoryDto } from "./dto/update-menu-category.dto"
import { MenuCategoriesService } from "./menu-categories.service"

@Controller("menu-categories")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenuCategoriesController {
	constructor(private readonly menuCategoriesService: MenuCategoriesService) {}

	@Post()
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async create(
		@Body() dto: CreateMenuCategoryDto,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.menuCategoriesService.create(dto, ownerId)
	}

	@Get("by-restaurant/:restaurantId")
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async findAllByRestaurant(
		@Param("restaurantId", new ParseUUIDPipe()) restaurantId: string,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.menuCategoriesService.findAllByRestaurant(restaurantId, ownerId)
	}

	@Patch(":id")
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	async update(
		@Param("id", new ParseUUIDPipe()) categoryId: string,
		@Body() dto: UpdateMenuCategoryDto,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		return this.menuCategoriesService.update(categoryId, dto, ownerId)
	}

	@Delete(":id")
	@Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param("id", new ParseUUIDPipe()) categoryId: string,
		@Request() req: RequestWithJwtUser
	) {
		const ownerId = req.user.userId

		await this.menuCategoriesService.remove(categoryId, ownerId)
	}
}
