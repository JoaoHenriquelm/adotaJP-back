import type { FastifyReply, FastifyRequest } from "fastify"
import { loginSchema, registerSchema } from "../schemas/auth.schema.js"
import type { AuthService } from "../services/auth.service.js"

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const parsedBody = registerSchema.parse(request.body)
    const user = await this.authService.register(parsedBody)
    reply.status(201).send(user)
  }

  login = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const parsedBody = loginSchema.parse(request.body)
    const loginResult = await this.authService.login(parsedBody)
    reply.status(200).send(loginResult)
  }
}
