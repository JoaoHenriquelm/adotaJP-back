import { buildApp } from "./app.js"
import { connectDatabase, disconnectDatabase } from "./config/database.js"
import { env } from "./config/env.js"
import { startDeactivateExpiredPostsJob } from "./jobs/deactivate-expired-posts.job.js"
import { createAppDependencies } from "./routes/index.js"

const start = async (): Promise<void> => {
  try {
    await connectDatabase()

    const deps = createAppDependencies()
    const app = await buildApp(deps)

    const deactivateJob = startDeactivateExpiredPostsJob(
      deps.animalPostRepository,
    )

    await app.listen({ port: env.PORT, host: env.HOST })
    console.log(`Server is running on port ${env.PORT}`)

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`Received ${signal}. Shutting down gracefully...`)
      await deactivateJob.stop()
      await app.close()
      await disconnectDatabase()
      process.exit(0)
    }

    process.on("SIGINT", () => {
      void shutdown("SIGINT")
    })
    process.on("SIGTERM", () => {
      void shutdown("SIGTERM")
    })
  } catch (error: unknown) {
    console.error("Error starting server:", error)
    process.exit(1)
  }
}

void start()
