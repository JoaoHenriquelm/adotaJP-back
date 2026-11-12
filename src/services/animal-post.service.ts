import { Types } from "mongoose"
import { AppError } from "../errors/app-error.js"
import type { AnimalPostRepository } from "../repositories/animal-post.repository.js"
import type { UserRepository } from "../repositories/user.repository.js"
import type {
  AnimalPostOwnerResponse,
  AnimalPostPublicResponse,
  CreateAnimalPostDTO,
  UpdateAnimalPostDTO,
} from "../types/animal-post.types.js"
import type { PaginatedResult } from "../types/pagination.types.js"
import {
  toAnimalPostOwnerResponse,
  toAnimalPostPublicResponse,
} from "../utils/mappers.util.js"
import type { StorageService } from "./storage.service.js"

export class AnimalPostService {
  constructor(
    private readonly animalPostRepository: AnimalPostRepository,
    private readonly userRepository: UserRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(
    ownerId: string,
    data: CreateAnimalPostDTO,
  ): Promise<AnimalPostOwnerResponse> {
    const post = await this.animalPostRepository.store({
      name: data.name,
      species: data.species,
      age: data.age,
      ageUnit: data.ageUnit,
      weight: data.weight,
      vaccines: data.vaccines ?? "",
      illnesses: data.illnesses ?? "",
      owner: new Types.ObjectId(ownerId),
      imagePath: data.imagePath,
    })

    return toAnimalPostOwnerResponse(post)
  }

  async listAvailable(
    page: number,
    limit: number,
    species?: string,
  ): Promise<PaginatedResult<AnimalPostPublicResponse>> {
    const pagedResult = species
      ? await this.animalPostRepository.findBySpeciesPaged(species, page, limit)
      : await this.animalPostRepository.findAllPaged(page, limit)

    return {
      data: pagedResult.data.map(toAnimalPostPublicResponse),
      total: pagedResult.total,
      page: pagedResult.page,
      limit: pagedResult.limit,
      totalPages: pagedResult.totalPages,
    }
  }

  async getById(id: string): Promise<AnimalPostPublicResponse> {
    const post = await this.animalPostRepository.findByIdWithOwner(id)
    if (!post) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    return toAnimalPostPublicResponse(post)
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateAnimalPostDTO,
  ): Promise<AnimalPostOwnerResponse> {
    const existing = await this.animalPostRepository.findById(id)
    if (!existing) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    if (existing.owner.toString() !== ownerId) {
      throw new AppError(
        "Você não tem permissão para editar esta publicação.",
        403,
        "FORBIDDEN",
      )
    }

    const previousImagePath = existing.imagePath

    const updatedPost = await this.animalPostRepository.updateAnimalById(
      id,
      ownerId,
      data,
    )

    if (!updatedPost) {
      throw new AppError(
        "Não foi possível atualizar a publicação.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    if (data.imagePath !== undefined && data.imagePath !== previousImagePath) {
      await this.storageService.removeLocalImageIfOwned(previousImagePath)
    }

    return toAnimalPostOwnerResponse(updatedPost)
  }

  async confirmAvailability(
    id: string,
    ownerId: string,
  ): Promise<AnimalPostOwnerResponse> {
    const existing = await this.animalPostRepository.findById(id)
    if (!existing) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    if (existing.owner.toString() !== ownerId) {
      throw new AppError(
        "Você não tem permissão para confirmar a disponibilidade desta publicação.",
        403,
        "FORBIDDEN",
      )
    }

    if (existing.isAdopted) {
      throw new AppError(
        "Não é possível confirmar disponibilidade de um animal já adotado.",
        409,
        "ANIMAL_ALREADY_ADOPTED",
      )
    }

    const updatedPost = await this.animalPostRepository.confirmAvailability(
      id,
      ownerId,
    )

    if (!updatedPost) {
      throw new AppError(
        "Não foi possível confirmar a disponibilidade da publicação.",
        409,
        "AVAILABILITY_CONFIRMATION_FAILED",
      )
    }

    return toAnimalPostOwnerResponse(updatedPost)
  }

  async adopt(
    id: string,
    ownerId: string,
    desiredIsAdopted?: boolean,
  ): Promise<AnimalPostOwnerResponse> {
    const existing = await this.animalPostRepository.findById(id)
    if (!existing) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    if (existing.owner.toString() !== ownerId) {
      throw new AppError(
        "Você não tem permissão para alterar o status desta publicação.",
        403,
        "FORBIDDEN",
      )
    }

    const nextIsAdopted =
      desiredIsAdopted !== undefined ? desiredIsAdopted : !existing.isAdopted
    const nextStatus = !nextIsAdopted

    const now = new Date()
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
    const nextReturnDate =
      !nextIsAdopted && existing.returnDate <= now
        ? new Date(now.getTime() + thirtyDaysMs)
        : undefined

    const updatedPost = await this.animalPostRepository.updateStatus(
      id,
      ownerId,
      nextStatus,
      {
        isAdopted: nextIsAdopted,
        returnDate: nextReturnDate,
      },
    )

    if (!updatedPost) {
      throw new AppError(
        "Não foi possível atualizar o status de adoção da publicação.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    return toAnimalPostOwnerResponse(updatedPost)
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const existing = await this.animalPostRepository.findById(id)
    if (!existing) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    if (existing.owner.toString() !== ownerId) {
      throw new AppError(
        "Você não tem permissão para excluir esta publicação.",
        403,
        "FORBIDDEN",
      )
    }

    const deletedPost = await this.animalPostRepository.deleteById(id, ownerId)
    if (!deletedPost) {
      throw new AppError(
        "Publicação de animal não encontrada.",
        404,
        "ANIMAL_POST_NOT_FOUND",
      )
    }

    await Promise.all([
      this.userRepository.removeAnimalPostFromAllFavorites(id),
      this.storageService.removeLocalImageIfOwned(deletedPost.imagePath),
    ])
  }
}
