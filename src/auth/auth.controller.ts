import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common"
import { AuthService } from "./auth.service"
import { TelegramLoginDto } from "./dto/telegram-login.dto"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"
import { RequestWithJwtUser } from "./types/auth.types"

@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("telegram")
	loginViaTelegram(@Body() dto: TelegramLoginDto) {
		return this.authService.loginViaTelegram(dto)
	}

	@UseGuards(JwtAuthGuard)
	@Get("profile")
	getProfile(@Request() req: RequestWithJwtUser) {
		return req.user
	}
}
