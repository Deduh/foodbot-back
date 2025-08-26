import { z } from "zod"

export const configSchema = z.object({
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	DATABASE_URL: z.string().url(),
	JWT_SECRET: z.string(),
	ADMIN_BOT_TOKEN: z.string(),
	MAIN_BOT_TOKEN: z.string(),
})

export type Config = z.infer<typeof configSchema>
