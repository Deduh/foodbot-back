import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Post,
	UseGuards,
} from '@nestjs/common'
import { User as UserModel, UserRole } from '@prisma/client'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { CreateRestaurantOwnerDto } from './dto/create-restaurant-owner.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Post('restaurant-owner')
	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	async createRestaurantOwner(
		@Body() createRestaurantOwnerDto: CreateRestaurantOwnerDto
	): Promise<Omit<UserModel, 'passwordHash'>> {
		const newUser = await this.usersService.createRestaurantOwner(
			createRestaurantOwnerDto
		)

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { passwordHash, ...result } = newUser

		return result
	}
}
