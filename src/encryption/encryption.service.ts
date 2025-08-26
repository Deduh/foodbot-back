import {
	Injectable,
	InternalServerErrorException,
	Logger,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as crypto from "crypto"

const AES_GCM_ALGORITHM = "aes-256-gcm"

@Injectable()
export class EncryptionService {
	private readonly logger = new Logger(EncryptionService.name)
	private readonly encryptionKey: Buffer
	private readonly encryptionIv: Buffer

	constructor(private configService: ConfigService) {
		const key = this.configService.get<string>("BOT_TOKEN_ENCRYPTION_KEY")
		const iv = this.configService.get<string>("BOT_TOKEN_ENCRYPTION_IV")

		if (!key || !iv) {
			throw new InternalServerErrorException("Ключ шифрования не определен.")
		}

		this.encryptionKey = Buffer.from(key, "hex")
		this.encryptionIv = Buffer.from(iv, "hex")
	}

	encrypt(text: string): string {
		try {
			const cipher = crypto.createCipheriv(
				AES_GCM_ALGORITHM,
				this.encryptionKey,
				this.encryptionIv
			)
			let encrypted = cipher.update(text, "utf8", "hex")
			encrypted += cipher.final("hex")
			const authTag = cipher.getAuthTag().toString("hex")

			return `${encrypted}:${authTag}`
		} catch (error) {
			this.logger.error("Encryption failed", error)
			throw new InternalServerErrorException("Ошибка шифрования.")
		}
	}

	decrypt(encryptedTextWithAuthTag: string): string {
		try {
			const parts = encryptedTextWithAuthTag.split(":")

			if (parts.length !== 2) {
				throw new Error("Неверный формат зашифрованных данных.")
			}

			const encryptedText = parts[0]
			const authTag = Buffer.from(parts[1], "hex")
			const decipher = crypto.createDecipheriv(
				AES_GCM_ALGORITHM,
				this.encryptionKey,
				this.encryptionIv
			)

			decipher.setAuthTag(authTag)

			let decrypted = decipher.update(encryptedText, "hex", "utf8")
			decrypted += decipher.final("utf8")

			return decrypted
		} catch (error) {
			this.logger.error("Decryption failed", error)
			throw new InternalServerErrorException("Ошибка дешифрования.")
		}
	}
}
