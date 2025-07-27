import { Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
	extends PrismaClient
	implements OnModuleInit, OnApplicationShutdown
{
	constructor() {
		super({
			log: ['query', 'info', 'warn', 'error'],
		})
	}

	async onModuleInit() {
		await this.$connect()
		console.log('Prisma Client connected successfully.')
	}

	async onApplicationShutdown(signal?: string) {
		console.log(`Prisma Client disconnecting (signal: ${signal})...`)
		await this.$disconnect()
	}
}
