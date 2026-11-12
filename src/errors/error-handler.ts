import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"
import { ZodError } from "zod"
import { AppError } from "./app-error.js"

interface MongoDuplicateError {
  code?: number
  keyPattern?: Record<string, unknown>
}

function isMongoDuplicateKeyError(error: unknown): error is MongoDuplicateError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as MongoDuplicateError).code === 11000
  )
}

function hasErrorCode(error: unknown): error is { code: string; statusCode?: number; message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  )
}

export function errorHandler(
  error: FastifyError | unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    const payload: Record<string, unknown> = {
      statusCode: error.statusCode,
      error: error.code,
      message: error.message,
    }
    if (error.details !== undefined) {
      payload["details"] = error.details
    }
    reply.status(error.statusCode).send(payload)
    return
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }))
    reply.status(400).send({
      statusCode: 400,
      error: "VALIDATION_ERROR",
      message: "Dados inválidos na requisição.",
      details: issues,
    })
    return
  }

  if (isMongoDuplicateKeyError(error)) {
    const keys = error.keyPattern ? Object.keys(error.keyPattern) : []
    let message = "Registro duplicado para um campo único."

    if (keys.includes("email")) {
      message = "Este e-mail já está cadastrado."
    } else if (keys.includes("cpf")) {
      message = "Este CPF já está cadastrado."
    }

    reply.status(409).send({
      statusCode: 409,
      error: "CONFLICT",
      message,
    })
    return
  }

  if (hasErrorCode(error)) {
    if (error.code === "FST_REQ_FILE_TOO_LARGE") {
      reply.status(413).send({
        statusCode: 413,
        error: "PAYLOAD_TOO_LARGE",
        message: "O arquivo enviado excede o tamanho máximo permitido.",
      })
      return
    }

    if (error.code.startsWith("FST_ERR_CTP_") || error.statusCode === 400) {
      reply.status(400).send({
        statusCode: 400,
        error: "BAD_REQUEST",
        message: "Formato de requisição inválido.",
      })
      return
    }
  }

  request.log.error(error)
  reply.status(500).send({
    statusCode: 500,
    error: "INTERNAL_SERVER_ERROR",
    message: "Erro interno do servidor.",
  })
}
