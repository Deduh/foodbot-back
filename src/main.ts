import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	const config = new DocumentBuilder()
		.setTitle("FoodBot API")
		.setDescription("Документация REST API для проекта FoodBot")
		.setVersion("1.0")
		.addBearerAuth()
		.build()

	const document = SwaggerModule.createDocument(app, config)

	SwaggerModule.setup("api-docs", app, document)

	app.enableShutdownHooks()

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		})
	)

	app.enableCors({
		origin: true,
		methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
		credentials: true,
	})

	const port = process.env.PORT || 3000
	await app.listen(port)
	console.log(`Application is running on: ${await app.getUrl()}`)
	console.log(`Swagger UI is available on: http://localhost:${port}/api-docs`)
}
bootstrap()
