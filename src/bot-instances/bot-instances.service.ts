import { HttpService } from "@nestjs/axios"
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { BotInstance, Prisma } from "@prisma/client"
import axios from "axios"
import { firstValueFrom } from "rxjs"
import {
	TelegramBotInfo,
	TelegramResponse,
} from "src/common/types/telegram.types"
import { EncryptionService } from "src/encryption/encryption.service"
import { PrismaService } from "src/prisma/prisma.service"
import { CreateBotInstanceDto } from "./dto/create-bot-instance.dto"
import { UpdateBotInstanceDto } from "./dto/update-bot-instance.dto"

@Injectable()
export class BotInstancesService {
	private readonly logger = new Logger(BotInstancesService.name)
	private readonly telegramApiBaseUrl: string
	private readonly botWebhookBaseUrl: string

	constructor(
		private prisma: PrismaService,
		private configService: ConfigService,
		private readonly httpService: HttpService,
		private readonly encryptionService: EncryptionService
	) {
		this.telegramApiBaseUrl = this.configService.get<string>(
			"TELEGRAM_API_BASE_URL",
			"https://api.telegram.org"
		)

		const webhookBaseUrlFromConfig = this.configService.get<string>(
			"BOT_WEBHOOK_BASE_URL"
		)

		if (!webhookBaseUrlFromConfig) {
			this.logger.error(
				"BOT_WEBHOOK_BASE_URL is not defined in environment variables."
			)
			throw new InternalServerErrorException(
				"Базовый URL для вебхуков бота не определен в .env файле."
			)
		}

		this.botWebhookBaseUrl = webhookBaseUrlFromConfig
	}

	async create(
		dto: CreateBotInstanceDto
	): Promise<Omit<BotInstance, "botToken">> {
		const restaurant = await this.prisma.restaurant.findUnique({
			where: { id: dto.restaurantId },
		})

		if (!restaurant) {
			throw new NotFoundException(
				`Ресторан с ID "${dto.restaurantId}" не найден.`
			)
		}

		let actualBotUsername: string

		try {
			const getMeUrl = `${this.telegramApiBaseUrl}/bot${dto.botToken}/getMe`

			const response = await firstValueFrom(
				this.httpService.get<TelegramResponse<TelegramBotInfo>>(getMeUrl)
			)

			if (!response.data?.ok || !response.data.result?.username) {
				this.logger.warn(
					`Telegram API getMe call failed or returned invalid data for token: ${dto.botToken.substring(0, 10)}... Response: ${JSON.stringify(response.data)},
					`
				)

				throw new BadRequestException(`
					Невалидный токен бота или не удалось получить информацию о боте. ${response.data?.description || ""},
					`)
			}

			actualBotUsername = response.data.result.username

			if (
				dto.botUsername &&
				dto.botUsername.replace("@", "") !== actualBotUsername
			) {
				this.logger.warn(
					`Provided botUsername @${dto.botUsername.replace("@", "")} does not match actual @${actualBotUsername} for token ${dto.botToken.substring(0, 10)}... Using actual username.`
				)
			}
		} catch (error) {
			this.logger.error(
				`Failed to validate bot token ${dto.botToken.substring(0, 10)}... with Telegram API:`,
				error instanceof Error ? error.message : String(error)
			)

			if (axios.isAxiosError(error) && error.response?.data) {
				const telegramError = error.response.data as TelegramResponse<unknown>
				if (telegramError.description) {
					throw new BadRequestException(
						`Ошибка Telegram API: ${telegramError.description}`
					)
				}
			}

			throw new BadRequestException(
				"Не удалось проверить токен бота. Убедитесь, что токен корректен."
			)
		}

		const encryptedBotToken = this.encryptionService.encrypt(dto.botToken)
		let newBotInstance: BotInstance

		try {
			newBotInstance = await this.prisma.botInstance.create({
				data: {
					botToken: encryptedBotToken,
					botUsername: actualBotUsername,
					restaurantId: dto.restaurantId,
					isActive: false,
					isWebhookSet: false,
				},
			})

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { botToken, ...result } = newBotInstance
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2002") {
					let field = "неизвестное поле"

					if (
						Array.isArray(error.meta?.target) &&
						error.meta.target.length > 0
					) {
						field = error.meta.target.join(", ")
					} else if (typeof error.meta?.target === "string") {
						field = error.meta.target
					}

					this.logger.error(
						`Unique constraint violation on field(s) '${field}' while creating bot instance.`
					)

					throw new BadRequestException(
						`Экземпляр бота с таким токеном или для этого ресторана уже существует (поле: ${field}).`
					)
				}
			}

			if (error instanceof Error) {
				this.logger.error("Failed to create bot instance in DB:", error.stack)
			} else {
				this.logger.error(
					"Failed to create bot instance in DB with unknown error type:",
					error
				)
			}

			throw new InternalServerErrorException(
				"Не удалось сохранить экземпляр бота."
			)
		}

		try {
			const webhookUrl = `${this.botWebhookBaseUrl}/api/telegram/webhook/${newBotInstance.id}`
			const setWebhookUrl = `${this.telegramApiBaseUrl}/bot${dto.botToken}/setWebhook`

			const webhookResponse = await firstValueFrom(
				this.httpService.post<TelegramResponse<boolean>>(setWebhookUrl, {
					url: webhookUrl,
				})
			)

			if (!webhookResponse.data?.ok || webhookResponse.data?.result !== true) {
				this.logger.error(
					`Failed to set webhook for bot ${newBotInstance.id} (@${actualBotUsername}). Telegram response: ${JSON.stringify(webhookResponse.data)}`
				)

				throw new InternalServerErrorException(
					`Не удалось установить вебхук для бота: ${webhookResponse.data?.description || "неизвестная ошибка Telegram"}.`
				)
			}

			this.logger.log(
				`Webhook set successfully for bot ${newBotInstance.id} (@${actualBotUsername}) to ${webhookUrl}`
			)

			const updatedBotInstance = await this.prisma.botInstance.update({
				where: { id: newBotInstance.id },
				data: { isWebhookSet: true, isActive: true },
			})

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { botToken, ...resultWithoutToken } = updatedBotInstance

			return resultWithoutToken
		} catch (error) {
			this.logger.error(
				`Error setting webhook for bot ${newBotInstance.id} (@${actualBotUsername}):`,
				error instanceof Error ? error.stack : error
			)

			throw new InternalServerErrorException(
				`Экземпляр бота был создан в БД (ID: ${newBotInstance.id}), но не удалось установить вебхук.`
			)
		}
	}

	async findOneByRestaurantId(
		restaurantId: string
	): Promise<Omit<BotInstance, "botToken">> {
		const botInstance = await this.prisma.botInstance.findUnique({
			where: { restaurantId },
		})

		if (!botInstance) {
			throw new NotFoundException(
				`Бот для ресторана с ID "${restaurantId}" не найден.`
			)
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { botToken, ...resultWithoutToken } = botInstance

		return resultWithoutToken
	}

	async findOne(id: string): Promise<Omit<BotInstance, "botToken">> {
		const botInstance = await this.prisma.botInstance.findUnique({
			where: { id },
		})

		if (!botInstance) {
			throw new NotFoundException(`Экземпляр бота с ID "${id}" не найден.`)
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { botToken, ...resultWithoutToken } = botInstance

		return resultWithoutToken
	}

	async update(
		id: string,
		updateDto: UpdateBotInstanceDto
	): Promise<Omit<BotInstance, "botToken">> {
		await this.findOne(id)

		try {
			const updatedBotInstance = await this.prisma.botInstance.update({
				where: { id },
				data: {
					isActive: updateDto.isActive,
					welcomeMessage: updateDto.welcomeMessage,
					logoUrl: updateDto.logoUrl,
				},
			})
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { botToken, ...resultWithoutToken } = updatedBotInstance

			return resultWithoutToken
		} catch (error) {
			this.logger.error(`Failed to update bot instance ${id}:`, error)
			throw new InternalServerErrorException(
				"Не удалось обновить экземпляр бота."
			)
		}
	}

	async remove(id: string): Promise<Omit<BotInstance, "botToken">> {
		const botInstanceToRemove = await this.prisma.botInstance.findUnique({
			where: { id },
		})

		if (!botInstanceToRemove) {
			throw new NotFoundException(
				`Экземпляр бота с ID "${id}" для удаления не найден.`
			)
		}

		let originalToken: string | null = null

		try {
			originalToken = this.encryptionService.decrypt(
				botInstanceToRemove.botToken
			)
		} catch (decryptionError) {
			if (decryptionError instanceof Error) {
				this.logger.error(
					`Failed to decrypt token for bot ${id} during removal, proceeding with DB deletion only. Error: ${decryptionError.message}`,
					decryptionError.stack
				)
			} else {
				this.logger.error(
					`Failed to decrypt token for bot ${id} during removal with a non-Error object, proceeding with DB deletion only. Caught: ${String(decryptionError)}`
				)
			}
		}

		if (originalToken) {
			try {
				const deleteWebhookUrl = `${this.telegramApiBaseUrl}/bot${originalToken}/deleteWebhook`

				await firstValueFrom(
					this.httpService.post(deleteWebhookUrl, {
						drop_pending_updates: true,
					})
				)

				this.logger.log(
					`Webhook for bot ${id} (@${botInstanceToRemove.botUsername}) successfully deleted from Telegram.`
				)
			} catch (error) {
				let errorMessage = "Unknown error"

				if (axios.isAxiosError(error) && error.response?.data) {
					const telegramError = error.response.data as TelegramResponse<unknown>

					errorMessage =
						telegramError.description || JSON.stringify(error.response.data)
				} else if (error instanceof Error) {
					errorMessage = error.message
				} else {
					errorMessage = String(error)
				}

				this.logger.warn(
					`Could not delete webhook for bot ${id} (@${botInstanceToRemove.botUsername}) from Telegram. It might have been already removed or token is invalid. Error: ${errorMessage}`
				)
			}
		}

		try {
			const deletedBotInstance = await this.prisma.botInstance.delete({
				where: { id },
			})

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { botToken, ...resultWithoutToken } = deletedBotInstance

			return resultWithoutToken
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				throw new NotFoundException(
					`Экземпляр бота с ID "${id}" для удаления не найден.`
				)
			}

			this.logger.error(`Failed to delete bot instance ${id}:`, error)
			throw new InternalServerErrorException(
				"Не удалось удалить экземпляр бота."
			)
		}
	}
}
