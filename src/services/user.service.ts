import { AppError } from "../errors/app-error.js"
import type { AnimalPostRepository } from "../repositories/animal-post.repository.js"
import type { UserRepository } from "../repositories/user.repository.js"
import type {
  AnimalPostOwnerResponse,
  AnimalPostPublicResponse,
} from "../types/animal-post.types.js"
import type { PaginatedResult } from "../types/pagination.types.js"
import type {
  UpdateUserContactDTO,
  UserProfileResponse,
} from "../types/user.types.js"
import {
  toAnimalPostOwnerResponse,
  toAnimalPostPublicResponse,
  toUserProfileResponse,
} from "../utils/mappers.util.js"

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly animalPostRepository: AnimalPostRepository,
  ) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND")
    }

    return toUserProfileResponse(user)
  }

  async updateContact(
    userId: string,
    data: UpdateUserContactDTO,
  ): Promise<UserProfileResponse> {
    const updatedUser = await this.userRepository.updateById(userId, data)
    if (!updatedUser) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND")
    }

    return toUserProfileResponse(updatedUser)
  }

  async listFavorites(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<AnimalPostPublicResponse>> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND")
    }

    const pagedResult = await this.userRepository.findFavoriteAnimalsPaged(
      userId,
      page,
      limit,
    )

    return {
      data: pagedResult.data.map(toAnimalPostPublicResponse),
      total: pagedResult.total,
      page: pagedResult.page,
      limit: pagedResult.limit,
      totalPages: pagedResult.totalPages,
    }
  }

  async addFavorite(
    userId: string,
    animalPostId: string,
  ): Promise<UserProfileResponse> {
    const post = await this.animalPostRepository.findById(animalPostId)
    if (!post) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    if (!post.status) {
      throw new AppError(
        "Não é possível favoritar uma publicação indisponível.",
        400,
        "ANIMAL_POST_UNAVAILABLE",
      )
    }

    const updatedUser = await this.userRepository.addFavoriteAnimalPost(
      userId,
      animalPostId,
    )
    if (!updatedUser) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND")
    }

    return toUserProfileResponse(updatedUser)
  }

  async removeFavorite(
    userId: string,
    animalPostId: string,
  ): Promise<UserProfileResponse> {
    const updatedUser = await this.userRepository.removeFavoriteAnimalPost(
      userId,
      animalPostId,
    )
    if (!updatedUser) {
      throw new AppError("Usuário não encontrado.", 404, "USER_NOT_FOUND")
    }

    return toUserProfileResponse(updatedUser)
  }

  async listMyAnimalPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<AnimalPostOwnerResponse>> {
    const pagedResult = await this.animalPostRepository.findByOwnerPaged(
      userId,
      page,
      limit,
    )

    return {
      data: pagedResult.data.map(toAnimalPostOwnerResponse),
      total: pagedResult.total,
      page: pagedResult.page,
      limit: pagedResult.limit,
      totalPages: pagedResult.totalPages,
    }
  }
}
