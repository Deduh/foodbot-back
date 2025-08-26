import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"
import { EncryptionModule } from "src/encryption/encryption.module"
import { BotInstancesController } from "./bot-instances.controller"
import { BotInstancesService } from "./bot-instances.service"

@Module({
	imports: [HttpModule, EncryptionModule],
	providers: [BotInstancesService],
	controllers: [BotInstancesController],
	exports: [BotInstancesService],
})
export class BotInstancesModule {}
