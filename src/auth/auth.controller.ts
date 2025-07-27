import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Request,
	UseGuards,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { CreateUserDto } from './dto/create-user.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { RequestWithJwtUser, RequestWithLocalUser } from './types/auth.types'

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@UseGuards(LocalAuthGuard)
	@Post('login')
	login(
		@Request() req: RequestWithLocalUser,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		@Body() loginDto: LoginDto
	) {
		return this.authService.login(req.user)
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	getProfile(@Request() req: RequestWithJwtUser) {
		return req.user
	}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	async register(@Body() createUserDto: CreateUserDto) {
		return this.authService.register(createUserDto)
	}
}
