import type { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"
import { Types } from "mongoose"
import { env } from "../config/env.js"
import { AppError } from "../errors/app-error.js"
import type { AuthTokenPayload } from "../types/user.types.js"

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthTokenPayload
  }
}

function isAuthTokenPayload(decoded: unknown): decoded is AuthTokenPayload {
  if (typeof decoded !== "object" || decoded === null) {
    return false
  }

  const candidate = decoded as Record<string, unknown>
  return (
    typeof candidate["sub"] === "string" &&
    Types.ObjectId.isValid(candidate["sub"]) &&
    typeof candidate["email"] === "string"
  )
}

export async function authenticateMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError(
      "Token de autenticação ausente ou malformado.",
      401,
      "UNAUTHORIZED",
    )
  }

  const token = authHeader.slice("Bearer ".length).trim()
  if (!token) {
    throw new AppError(
      "Token de autenticação ausente.",
      401,
      "UNAUTHORIZED",
    )
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    if (!isAuthTokenPayload(decoded)) {
      throw new AppError("Token de autenticação inválido.", 401, "UNAUTHORIZED")
    }

    request.user = {
      sub: decoded.sub,
      email: decoded.email,
    }
  } catch (error: unknown) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(
      "Token de autenticação inválido ou expirado.",
      401,
      "UNAUTHORIZED",
    )
  }
}

export function getAuthenticatedUserId(request: FastifyRequest): string {
  if (!request.user?.sub) {
    throw new AppError("Usuário não autenticado.", 401, "UNAUTHORIZED")
  }
  return request.user.sub
}
