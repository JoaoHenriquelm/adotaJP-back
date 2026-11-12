import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(1000),
  HOST: z.string().trim().min(1).default("0.0.0.0"),
  MONGODB_URI: z
    .string()
    .trim()
    .min(1),
  JWT_SECRET: z
    .string()
    .min(16),
  JWT_EXPIRES_IN: z.string().trim().min(1).default("7d"),
  UPLOAD_DIR: z.string().trim().min(1).default("uploads"),
  MAX_FILE_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.issues)
  process.exit(1)
}

if (
  parsedEnv.data.NODE_ENV === "production" &&
  process.env["JWT_SECRET"] === undefined
) {
  console.error("JWT_SECRET must be explicitly configured in production.")
  process.exit(1)
}

export const env = parsedEnv.data
