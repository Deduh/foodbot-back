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
import { BotInstance as BotInstanceModel, UserRole } from '@prisma/client'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { BotInstancesService } from './bot-instances.service'
import { CreateBotInstanceDto } from './dto/create-bot-instance.dto'
import { UpdateBotInstanceDto } from './dto/update-bot-instance.dto'

@Controller('bot-instances')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BotInstancesController {
	constructor(private readonly botInstancesService: BotInstancesService) {}

	@Post()
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.CREATED)
	async create(
		@Body() createBotInstanceDto: CreateBotInstanceDto
	): Promise<Omit<BotInstanceModel, 'botToken'>> {
		return this.botInstancesService.create(createBotInstanceDto)
	}

	@Get('by-restaurant/:restaurantId')
	@Roles(UserRole.ADMIN)
	async findOneByRestaurantId(
		@Param('restaurantId', new ParseUUIDPipe({ version: '4' }))
		restaurantId: string
	): Promise<Omit<BotInstanceModel, 'botToken'>> {
		return this.botInstancesService.findOneByRestaurantId(restaurantId)
	}

	@Get(':id')
	@Roles(UserRole.ADMIN)
	async findOne(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string
	): Promise<Omit<BotInstanceModel, 'botToken'> | null> {
		return this.botInstancesService.findOne(id)
	}

	@Patch(':id')
	@Roles(UserRole.ADMIN)
	async update(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
		@Body() updateBotInstanceDto: UpdateBotInstanceDto
	): Promise<Omit<BotInstanceModel, 'botToken'>> {
		return this.botInstancesService.update(id, updateBotInstanceDto)
	}

	@Delete(':id')
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(
		@Param('id', new ParseUUIDPipe({ version: '4' })) id: string
	): Promise<void> {
		await this.botInstancesService.remove(id)
	}
}
