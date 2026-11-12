import type { FastifyReply, FastifyRequest } from "fastify"
import { AppError } from "../errors/app-error.js"
import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js"
import {
  adoptAnimalPostBodySchema,
  createAnimalPostSchema,
  listAnimalPostsQuerySchema,
  updateAnimalPostSchema,
} from "../schemas/animal-post.schema.js"
import { idParamSchema } from "../schemas/common.schema.js"
import type { AnimalPostService } from "../services/animal-post.service.js"
import type { StorageService } from "../services/storage.service.js"

const ALLOWED_FILE_FIELD_NAMES = new Set(["image", "photo", "file"])

interface ExtractedAnimalPostInput {
  fields: unknown
  uploadedImagePath?: string
}

export class AnimalPostController {
  constructor(
    private readonly animalPostService: AnimalPostService,
    private readonly storageService: StorageService,
  ) {}

  private async extractBodyOrMultipart(
    request: FastifyRequest,
  ): Promise<ExtractedAnimalPostInput> {
    if (!request.isMultipart()) {
      return { fields: request.body }
    }

    const rawFields: Record<string, unknown> = {}
    let uploadedImagePath: string | undefined

    try {
      for await (const part of request.parts()) {
        if (part.type === "file") {
          if (!ALLOWED_FILE_FIELD_NAMES.has(part.fieldname)) {
            part.file.resume()
            throw new AppError(
              `Campo de arquivo inválido ('${part.fieldname}'). Utilize 'image', 'photo' ou 'file'.`,
              400,
              "INVALID_FILE_FIELD",
            )
          }

          if (uploadedImagePath !== undefined) {
            part.file.resume()
            throw new AppError(
              "Envie apenas uma imagem por publicação.",
              400,
              "MULTIPLE_FILES_NOT_ALLOWED",
            )
          }

          uploadedImagePath = await this.storageService.saveAnimalImage(part)
        } else {
          rawFields[part.fieldname] = part.value
        }
      }
    } catch (error: unknown) {
      if (uploadedImagePath !== undefined) {
        await this.storageService.removeLocalImageIfOwned(uploadedImagePath)
      }
      throw error
    }

    if (uploadedImagePath !== undefined) {
      rawFields["imagePath"] = uploadedImagePath
      return { fields: rawFields, uploadedImagePath }
    }

    return { fields: rawFields }
  }

  create = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const ownerId = getAuthenticatedUserId(request)
    const { fields, uploadedImagePath } =
      await this.extractBodyOrMultipart(request)

    try {
      const parsedData = createAnimalPostSchema.parse(fields)
      const createdPost = await this.animalPostService.create(
        ownerId,
        parsedData,
      )
      reply.status(201).send(createdPost)
    } catch (error: unknown) {
      if (uploadedImagePath !== undefined) {
        await this.storageService.removeLocalImageIfOwned(uploadedImagePath)
      }
      throw error
    }
  }

  listAvailable = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const { page, limit, species } = listAnimalPostsQuerySchema.parse(
      request.query,
    )
    const result = await this.animalPostService.listAvailable(
      page,
      limit,
      species,
    )
    reply.status(200).send(result)
  }

  getById = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const { id } = idParamSchema.parse(request.params)
    const post = await this.animalPostService.getById(id)
    reply.status(200).send(post)
  }

  update = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const ownerId = getAuthenticatedUserId(request)
    const { id } = idParamSchema.parse(request.params)
    const { fields, uploadedImagePath } =
      await this.extractBodyOrMultipart(request)

    try {
      const parsedData = updateAnimalPostSchema.parse(fields)
      const updatedPost = await this.animalPostService.update(
        id,
        ownerId,
        parsedData,
      )
      reply.status(200).send(updatedPost)
    } catch (error: unknown) {
      if (uploadedImagePath !== undefined) {
        await this.storageService.removeLocalImageIfOwned(uploadedImagePath)
      }
      throw error
    }
  }

  confirmAvailability = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const ownerId = getAuthenticatedUserId(request)
    const { id } = idParamSchema.parse(request.params)
    const updatedPost = await this.animalPostService.confirmAvailability(
      id,
      ownerId,
    )
    reply.status(200).send(updatedPost)
  }

  adopt = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const ownerId = getAuthenticatedUserId(request)
    const { id } = idParamSchema.parse(request.params)
    const parsedBody = adoptAnimalPostBodySchema.parse(request.body)
    const updatedPost = await this.animalPostService.adopt(
      id,
      ownerId,
      parsedBody?.isAdopted,
    )
    reply.status(200).send(updatedPost)
  }

  delete = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const ownerId = getAuthenticatedUserId(request)
    const { id } = idParamSchema.parse(request.params)
    await this.animalPostService.delete(id, ownerId)
    reply.status(204).send()
  }
}
