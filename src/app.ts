import { mkdir } from "node:fs/promises"
import fastifyCors from "@fastify/cors"
import fastifyMultipart from "@fastify/multipart"
import fastifyStatic from "@fastify/static"
import Fastify, { type FastifyInstance } from "fastify"
import { env } from "./config/env.js"
import { errorHandler } from "./errors/error-handler.js"
import {
  createApiRoutes,
  createAppDependencies,
  type AppDependencies,
} from "./routes/index.js"

export async function buildApp(
  deps: AppDependencies = createAppDependencies(),
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  })

  app.setErrorHandler(errorHandler)

  await app.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE_BYTES,
      files: 1,
    },
  })

  const uploadDirPath = deps.storageService.getUploadDirPath()
  await mkdir(uploadDirPath, { recursive: true })

  await app.register(fastifyStatic, {
    root: uploadDirPath,
    prefix: `/${env.UPLOAD_DIR}/`,
    decorateReply: false,
  })

  await app.register(createApiRoutes(deps))

  return app
}
