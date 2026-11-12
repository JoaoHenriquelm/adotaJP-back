import mongoose from "mongoose"
import { env } from "./env.js"

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("error", (err: unknown) => {
    console.error("[MongoDB] Connection error:", err)
  })

  await mongoose.connect(env.MONGODB_URI)
  console.log("[MongoDB] Connected successfully")
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
  console.log("[MongoDB] Disconnected")
}
