import { Types } from "mongoose"
import { UserModel } from "../models/user.model.js"
import { AnimalPostModel } from "../models/animal-post.model.js"
import type {
  CreateUserRepositoryDTO,
  UpdateUserContactDTO,
  UserDocument,
} from "../types/user.types.js"
import type {
  PopulatedAnimalPostDocument,
  PopulatedOwnerFields,
} from "../types/animal-post.types.js"
import type { PaginatedResult } from "../types/pagination.types.js"

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id
}

export class UserRepository {
  async store(data: CreateUserRepositoryDTO): Promise<UserDocument> {
    const user = await UserModel.create({
      name: data.name,
      passwordHash: data.passwordHash,
      email: data.email.trim().toLowerCase(),
      cpf: data.cpf,
      birthDate: data.birthDate,
      phone: data.phone,
      address: data.address,
      favoriteAnimals: [],
    })

    return user
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email: email.trim().toLowerCase() }).exec()
  }

  async findByCpf(cpf: string): Promise<UserDocument | null> {
    return UserModel.findOne({ cpf }).exec()
  }

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return UserModel.findById(toObjectId(id)).exec()
  }

  async updateById(
    id: string | Types.ObjectId,
    data: UpdateUserContactDTO,
  ): Promise<UserDocument | null> {
    const allowedFields: Record<string, string> = {}

    if (data.phone !== undefined) {
      allowedFields["phone"] = data.phone
    }

    if (data.address !== undefined) {
      allowedFields["address"] = data.address
    }

    return UserModel.findByIdAndUpdate(
      toObjectId(id),
      { $set: allowedFields },
      { returnDocument: "after", runValidators: true },
    ).exec()
  }

  async addFavoriteAnimalPost(
    userId: string | Types.ObjectId,
    animalPostId: string | Types.ObjectId,
  ): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      toObjectId(userId),
      { $addToSet: { favoriteAnimals: toObjectId(animalPostId) } },
      { returnDocument: "after" },
    ).exec()
  }

  async removeFavoriteAnimalPost(
    userId: string | Types.ObjectId,
    animalPostId: string | Types.ObjectId,
  ): Promise<UserDocument | null> {
    return UserModel.findByIdAndUpdate(
      toObjectId(userId),
      { $pull: { favoriteAnimals: toObjectId(animalPostId) } },
      { returnDocument: "after" },
    ).exec()
  }

  async removeAnimalPostFromAllFavorites(
    animalPostId: string | Types.ObjectId,
  ): Promise<number> {
    const postId = toObjectId(animalPostId)
    const result = await UserModel.updateMany(
      { favoriteAnimals: postId },
      { $pull: { favoriteAnimals: postId } },
    ).exec()

    return result.modifiedCount
  }

  async findFavoriteAnimalsPaged(
    userId: string | Types.ObjectId,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<PopulatedAnimalPostDocument>> {
    const user = await UserModel.findById(toObjectId(userId))
      .select("favoriteAnimals")
      .lean()
      .exec()

    if (!user || user.favoriteAnimals.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      }
    }

    const filter = {
      _id: { $in: user.favoriteAnimals },
      status: true,
    }

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
}
