import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { OnEvent } from "@nestjs/event-emitter"
import { Order } from "@prisma/client"
import { EncryptionService } from "src/encryption/encryption.service"
import { PrismaService } from "src/prisma/prisma.service"
import { RestaurantBotKeyboardsService } from "src/restaurant-bot/keyboards/restaurant-bot.keyboards.service"
import { RestaurantBotUpdate } from "src/restaurant-bot/update/restaurant-bot.update.service"
import { Telegraf } from "telegraf"

@Injectable()
export class BotLaunchService implements OnModuleInit {
	private readonly logger = new Logger(BotLaunchService.name)
	private bots = new Map<string, Telegraf<any>>()
	private readonly encryptionKey: Buffer
	private readonly encryptionIv: Buffer

	constructor(
		private readonly prisma: PrismaService,
		private readonly configService: ConfigService,
		private readonly restaurantBotUpdate: RestaurantBotUpdate,
		private readonly encryptionService: EncryptionService,
		private readonly keyboardsService: RestaurantBotKeyboardsService
	) {}

	async onModuleInit() {
		this.logger.log("Launching restaurant bots...")

		await this.launchBots()
	}

	private async launchBots() {
		const botInstances = await this.prisma.botInstance.findMany({
			where: { isActive: true },
		})

		this.logger.log(`Found ${botInstances.length} active bots to launch.`)

		for (const botInstance of botInstances) {
			try {
				const token = this.encryptionService.decrypt(botInstance.botToken)
				const bot = new Telegraf(token)

				bot.start(ctx => this.restaurantBotUpdate.onStart(ctx))

				this.bots.set(botInstance.id, bot)

				bot.launch().catch(error => {
					this.logger.error(`Bot @${botInstance.botUsername} crashed!`, error)
				})

				this.logger.log(
					`Bot @${botInstance.botUsername} launched successfully.`
				)
			} catch (error) {
				this.logger.error(
					`Failed to launch bot for restaurant ${botInstance.restaurantId}`,
					error
				)
			}
		}
	}

	@OnEvent("order.created")
	async handleOrderCreatedEvent(order: Order) {
		this.logger.log(`New order ${order.id} created. Sending notification...`)

		const botInstance = await this.prisma.botInstance.findUnique({
			where: { restaurantId: order.restaurantId },
		})

		if (!botInstance || !this.bots.has(botInstance.id)) {
			this.logger.warn(
				`Bot for restaurant ${order.restaurantId} not found or not running.`
			)

			return
		}

		const owners = await this.prisma.user.findMany({
			where: { restaurantId: order.restaurantId, role: "RESTAURANT_OWNER" },
		})

		if (owners.length === 0) {
			this.logger.warn(`No owners found for restaurant ${order.restaurantId}.`)
			return
		}

		const bot = this.bots.get(botInstance.id)!
		const message = `🔔 *Новый заказ!*\n\nID: \`${order.id}\`\nСумма: *${order.totalPrice.toString()}*\n\nПодробности в панели управления.`

		for (const owner of owners) {
			if (owner.telegramChatId) {
				try {
					await bot.telegram.sendMessage(owner.telegramChatId, message, {
						parse_mode: "MarkdownV2",
						...this.keyboardsService.getNewOrderKeyboard(order.id),
					})
				} catch (error) {
					this.logger.error(
						`Failed to send notification to owner ${owner.id}`,
						error
					)
				}
			}
		}
	}
}
