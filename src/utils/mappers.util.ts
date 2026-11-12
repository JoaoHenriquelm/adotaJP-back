import type {
  AnimalPostDocument,
  AnimalPostOwnerResponse,
  AnimalPostPublicResponse,
  PopulatedAnimalPostDocument,
} from "../types/animal-post.types.js"
import type { UserDocument, UserProfileResponse } from "../types/user.types.js"

export function toUserProfileResponse(user: UserDocument): UserProfileResponse {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    birthDate: user.birthDate,
    phone: user.phone,
    address: user.address,
    favoriteAnimals: user.favoriteAnimals.map((favId) => favId.toString()),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export function toAnimalPostPublicResponse(
  post: PopulatedAnimalPostDocument,
): AnimalPostPublicResponse {
  return {
    id: post._id.toString(),
    name: post.name,
    species: post.species,
    age: post.age,
    ageUnit: post.ageUnit,
    weight: post.weight,
    vaccines: post.vaccines,
    illnesses: post.illnesses,
    status: post.status,
    publishedAt: post.publishedAt,
    returnDate: post.returnDate,
    imagePath: post.imagePath,
    owner: {
      id: post.owner._id.toString(),
      name: post.owner.name,
      email: post.owner.email,
      phone: post.owner.phone,
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

export function toAnimalPostOwnerResponse(
  post: AnimalPostDocument,
): AnimalPostOwnerResponse {
  return {
    id: post._id.toString(),
    name: post.name,
    species: post.species,
    age: post.age,
    ageUnit: post.ageUnit,
    weight: post.weight,
    vaccines: post.vaccines,
    illnesses: post.illnesses,
    status: post.status,
    isAdopted: post.isAdopted,
    ownerId: post.owner.toString(),
    publishedAt: post.publishedAt,
    returnDate: post.returnDate,
    imagePath: post.imagePath,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}
