import type { FastifyInstance } from "fastify"
import type { AuthController } from "../controllers/auth.controller.js"

export function createAuthRoutes(authController: AuthController) {
  return async function authRoutes(app: FastifyInstance): Promise<void> {
    app.post("/register", authController.register)
    app.post("/login", authController.login)
  }
}
