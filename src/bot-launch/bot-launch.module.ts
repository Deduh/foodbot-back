import { Module } from "@nestjs/common"
import { EncryptionModule } from "src/encryption/encryption.module"
import { PrismaModule } from "src/prisma/prisma.module"
import { RestaurantBotModule } from "src/restaurant-bot/restaurant-bot.module"
import { BotLaunchService } from "./bot-launch.service"

@Module({
	imports: [PrismaModule, RestaurantBotModule, EncryptionModule],
	providers: [BotLaunchService],
})
export class BotLaunchModule {}
