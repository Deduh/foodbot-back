import { Injectable, Logger, UnauthorizedException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { JwtService } from "@nestjs/jwt"
import { User, UserRole } from "@prisma/client"
import * as crypto from "crypto"
import { TelegramUserData } from "src/common/types/telegram.types"
import { UsersService } from "src/users/users.service"
import { TelegramLoginDto } from "./dto/telegram-login.dto"
import { JwtPayload } from "./types/jwt.types"

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name)

	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
		private configService: ConfigService
	) {}

	async loginViaTelegram(dto: TelegramLoginDto) {
		const userFromTelegram = this.validateTelegramInitData(dto.initData)

		if (!userFromTelegram) {
			throw new UnauthorizedException("Невалидные данные от Telegram.")
		}

		const telegramUserId = userFromTelegram.id.toString()

		let user = await this.usersService.findOneByTelegramUserId(telegramUserId)

		if (!user) {
			this.logger.log(`User ${telegramUserId} not found. Creating new user.`)

			user = await this.usersService.create({
				telegramUserId: telegramUserId,
				username: userFromTelegram.username,
				role: UserRole.CUSTOMER,
			})
		}

		return this.login(user)
	}

	login(user: User) {
		const payload: JwtPayload = {
			sub: user.id,
			telegramUserId: user.telegramUserId,
			role: user.role,
			restaurantId: user.restaurantId,
		}
		return {
			access_token: this.jwtService.sign(payload),
		}
	}

	private validateTelegramInitData(initData: string): TelegramUserData | null {
		const params = new URLSearchParams(initData)
		const hash = params.get("hash")
		params.delete("hash")

		const sortedKeys = Array.from(params.keys()).sort()
		const dataCheckString = sortedKeys
			.map(key => `${key}=${params.get(key)}`)
			.join("\n")

		const secretKey = crypto
			.createHmac("sha256", "WebAppData")
			.update(this.configService.get<string>("ADMIN_BOT_TOKEN")!)
			.digest()

		const calculatedHash = crypto
			.createHmac("sha256", secretKey)
			.update(dataCheckString)
			.digest("hex")

		if (calculatedHash === hash) {
			const userString = params.get("user")

			if (!userString) return null

			const user = JSON.parse(userString) as TelegramUserData

			return user
		}

		return null
	}
}
