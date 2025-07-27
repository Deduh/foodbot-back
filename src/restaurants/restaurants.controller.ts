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
} from '@nestjs/common'
import { Restaurant as RestaurantModel, UserRole } from '@prisma/client'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { CreateRestaurantDto } from './dto/create-restaurant.dto'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { RestaurantsService } from './restaurants.service'

@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantsController {
	constructor(private readonly restaurantsService: RestaurantsService) {}

	@Post()
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() createRestaurantDto: CreateRestaurantDto
	): Promise<RestaurantModel> {
		return this.restaurantsService.create(createRestaurantDto)
	}

	@Get()
	@Roles(UserRole.ADMIN)
	async findAll(): Promise<RestaurantModel[]> {
		return this.restaurantsService.findAll()
	}

	@Get(':id')
	@Roles(UserRole.ADMIN)
	async findOne(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string
	): Promise<RestaurantModel> {
		return this.restaurantsService.findOne(id)
	}

	@Patch(':id')
	@Roles(UserRole.ADMIN)
	async update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateRestaurantDto: UpdateRestaurantDto
	): Promise<RestaurantModel> {
		return this.restaurantsService.update(id, updateRestaurantDto)
	}

	@Delete(':id')
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string
	): Promise<void> {
		await this.restaurantsService.remove(id)
	}
}
