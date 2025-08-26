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
	UseGuards,
} from "@nestjs/common"
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger"
import { Restaurant as RestaurantModel, UserRole } from "@prisma/client"
import { Roles } from "src/auth/decorators/roles.decorator"
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard"
import { RolesGuard } from "src/auth/guards/roles.guard"
import { CreateRestaurantDto } from "./dto/create-restaurant.dto"
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto"
import { RestaurantsService } from "./restaurants.service"
import { RestaurantWithOwner } from "./types/restaurants.types"

@ApiBearerAuth()
@ApiTags("Restaurants")
@Controller("restaurants")
export class RestaurantsController {
	constructor(private readonly restaurantsService: RestaurantsService) {}

	@Get(":id/menu")
	async getMenu(@Param("id", new ParseUUIDPipe()) id: string) {
		return this.restaurantsService.getFullMenu(id)
	}

	@Post()
	@ApiOperation({ summary: "Создание нового ресторана" })
	@ApiResponse({ status: 201, description: "Ресторан успешно создан." })
	@ApiResponse({ status: 403, description: "Доступ запрещен (не админ)." })
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() createRestaurantDto: CreateRestaurantDto
	): Promise<RestaurantModel> {
		return this.restaurantsService.create(createRestaurantDto)
	}

	@Get()
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	async findAll(): Promise<RestaurantModel[]> {
		return this.restaurantsService.findAll()
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	async findOne(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string
	): Promise<RestaurantWithOwner> {
		return this.restaurantsService.findOne(id)
	}

	@Patch(":id")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	async update(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
		@Body() updateRestaurantDto: UpdateRestaurantDto
	): Promise<RestaurantWithOwner> {
		return this.restaurantsService.update(id, updateRestaurantDto)
	}

	@Delete(":id")
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param("id", new ParseUUIDPipe({ version: "4" })) id: string
	): Promise<void> {
		await this.restaurantsService.remove(id)
	}
}
