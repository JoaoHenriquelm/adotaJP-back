import type { FastifyReply, FastifyRequest } from "fastify"
import { getAuthenticatedUserId } from "../middlewares/auth.middleware.js"
import {
  animalPostIdParamSchema,
  paginationQuerySchema,
} from "../schemas/common.schema.js"
import { updateUserContactSchema } from "../schemas/user.schema.js"
import type { UserService } from "../services/user.service.js"

export class UserController {
  constructor(private readonly userService: UserService) {}

  getMe = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const userId = getAuthenticatedUserId(request)
    const profile = await this.userService.getProfile(userId)
    reply.status(200).send(profile)
  }

  updateMe = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const userId = getAuthenticatedUserId(request)
    const parsedBody = updateUserContactSchema.parse(request.body)
    const updatedProfile = await this.userService.updateContact(
      userId,
      parsedBody,
    )
    reply.status(200).send(updatedProfile)
  }

  listFavorites = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const userId = getAuthenticatedUserId(request)
    const { page, limit } = paginationQuerySchema.parse(request.query)
    const favorites = await this.userService.listFavorites(userId, page, limit)
    reply.status(200).send(favorites)
  }

  addFavorite = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const userId = getAuthenticatedUserId(request)
    const { animalPostId } = animalPostIdParamSchema.parse(request.params)
    const updatedUser = await this.userService.addFavorite(userId, animalPostId)
    reply.status(200).send(updatedUser)
  }

  removeFavorite = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const userId = getAuthenticatedUserId(request)
    const { animalPostId } = animalPostIdParamSchema.parse(request.params)
    const updatedUser = await this.userService.removeFavorite(
      userId,
      animalPostId,
    )
    reply.status(200).send(updatedUser)
  }

  listMyAnimalPosts = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> => {
    const userId = getAuthenticatedUserId(request)
    const { page, limit } = paginationQuerySchema.parse(request.query)
    const posts = await this.userService.listMyAnimalPosts(userId, page, limit)
    reply.status(200).send(posts)
  }
}
