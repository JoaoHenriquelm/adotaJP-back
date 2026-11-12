import { Types } from "mongoose"
import { AnimalPostModel } from "../models/animal-post.model.js"
import type {
  AnimalPostDocument,
  CreateAnimalPostRepositoryDTO,
  PopulatedAnimalPostDocument,
  PopulatedOwnerFields,
  UpdateAnimalPostDTO,
} from "../types/animal-post.types.js"
import type { PaginatedResult } from "../types/pagination.types.js"
import { normalizeSpecies } from "../utils/species.util.js"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id
}

function addThirtyDays(from: Date): Date {
  return new Date(from.getTime() + THIRTY_DAYS_MS)
}

export class AnimalPostRepository {
  async store(data: CreateAnimalPostRepositoryDTO): Promise<AnimalPostDocument> {
    const publishedAt = new Date()
    const returnDate = addThirtyDays(publishedAt)

    const post = await AnimalPostModel.create({
      name: data.name,
      species: normalizeSpecies(data.species),
      age: data.age,
      ageUnit: data.ageUnit,
      weight: data.weight,
      vaccines: data.vaccines,
      illnesses: data.illnesses,
      owner: data.owner,
      imagePath: data.imagePath,
      publishedAt,
      returnDate,
      status: true,
      isAdopted: false,
    })

    return post
  }

  async findAllPaged(
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PopulatedAnimalPostDocument>> {
    const filter = { status: true }
    const skip = (page - 1) * limit

    const [total, posts] = await Promise.all([
      AnimalPostModel.countDocuments(filter).exec(),
      AnimalPostModel.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate<{ owner: PopulatedOwnerFields | null }>(
          "owner",
          "_id name email phone",
        )
        .lean()
        .exec(),
    ])

    const validPosts = posts.filter(
      (post): post is typeof post & { owner: PopulatedOwnerFields } =>
        post.owner !== null,
    )

    return {
      data: validPosts,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    }
  }

  async findBySpeciesPaged(
    species: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PopulatedAnimalPostDocument>> {
    const normalizedSpecies = normalizeSpecies(species)
    const filter = { species: normalizedSpecies, status: true }
    const skip = (page - 1) * limit

    const [total, posts] = await Promise.all([
      AnimalPostModel.countDocuments(filter).exec(),
      AnimalPostModel.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate<{ owner: PopulatedOwnerFields | null }>(
          "owner",
          "_id name email phone",
        )
        .lean()
        .exec(),
    ])

    const validPosts = posts.filter(
      (post): post is typeof post & { owner: PopulatedOwnerFields } =>
        post.owner !== null,
    )

    return {
      data: validPosts,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    }
  }

  async findById(id: string | Types.ObjectId): Promise<AnimalPostDocument | null> {
    return AnimalPostModel.findById(toObjectId(id)).exec()
  }

  async findByIdWithOwner(
    id: string | Types.ObjectId,
  ): Promise<PopulatedAnimalPostDocument | null> {
    const post = await AnimalPostModel.findById(toObjectId(id))
      .populate<{ owner: PopulatedOwnerFields }>("owner", "_id name email phone")
      .lean()
      .exec()

    if (!post || !post.owner) {
      return null
    }

    return post
  }

  async findByOwnerPaged(
    ownerId: string | Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<AnimalPostDocument>> {
    const filter = { owner: toObjectId(ownerId) }
    const skip = (page - 1) * limit

    const [total, data] = await Promise.all([
      AnimalPostModel.countDocuments(filter).exec(),
      AnimalPostModel.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    }
  }

  async updateAnimalById(
    id: string | Types.ObjectId,
    ownerId: string | Types.ObjectId,
    data: UpdateAnimalPostDTO,
  ): Promise<AnimalPostDocument | null> {
    const editableFields: Record<string, unknown> = {}

    if (data.name !== undefined) {
      editableFields["name"] = data.name
    }
    if (data.species !== undefined) {
      editableFields["species"] = normalizeSpecies(data.species)
    }
    if (data.age !== undefined) {
      editableFields["age"] = data.age
    }
    if (data.ageUnit !== undefined) {
      editableFields["ageUnit"] = data.ageUnit
    }
    if (data.weight !== undefined) {
      editableFields["weight"] = data.weight
    }
    if (data.vaccines !== undefined) {
      editableFields["vaccines"] = data.vaccines
    }
    if (data.illnesses !== undefined) {
      editableFields["illnesses"] = data.illnesses
    }
    if (data.imagePath !== undefined) {
      editableFields["imagePath"] = data.imagePath
    }

    return AnimalPostModel.findOneAndUpdate(
      { _id: toObjectId(id), owner: toObjectId(ownerId) },
      { $set: editableFields },
      { returnDocument: "after", runValidators: true },
    ).exec()
  }

  async confirmAvailability(
    id: string | Types.ObjectId,
    ownerId: string | Types.ObjectId,
  ): Promise<AnimalPostDocument | null> {
    const now = new Date()
    const nextReturnDate = addThirtyDays(now)

    return AnimalPostModel.findOneAndUpdate(
      {
        _id: toObjectId(id),
        owner: toObjectId(ownerId),
        isAdopted: false,
      },
      {
        $set: {
          returnDate: nextReturnDate,
          status: true,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).exec()
  }

  async updateStatus(
    id: string | Types.ObjectId,
    ownerId: string | Types.ObjectId,
    status: boolean,
    options?: {
      isAdopted?: boolean | undefined
      returnDate?: Date | undefined
    },
  ): Promise<AnimalPostDocument | null> {
    const fieldsToUpdate: Record<string, unknown> = { status }
    if (options?.isAdopted !== undefined) {
      fieldsToUpdate["isAdopted"] = options.isAdopted
    }
    if (options?.returnDate !== undefined) {
      fieldsToUpdate["returnDate"] = options.returnDate
    }

    return AnimalPostModel.findOneAndUpdate(
      { _id: toObjectId(id), owner: toObjectId(ownerId) },
      { $set: fieldsToUpdate },
      { returnDocument: "after", runValidators: true },
    ).exec()
  }

  async deleteById(
    id: string | Types.ObjectId,
    ownerId: string | Types.ObjectId,
  ): Promise<AnimalPostDocument | null> {
    return AnimalPostModel.findOneAndDelete({
      _id: toObjectId(id),
      owner: toObjectId(ownerId),
    }).exec()
  }

  async deactivateExpiredPosts(): Promise<number> {
    const now = new Date()
    const result = await AnimalPostModel.updateMany(
      {
        status: true,
        returnDate: { $lte: now },
      },
      {
        $set: { status: false },
      },
    ).exec()

    return result.modifiedCount
  }
}
