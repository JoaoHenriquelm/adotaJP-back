import type { HydratedDocument, Types } from "mongoose"
import type { PublicOwnerSummary } from "./user.types.js"

export const AGE_UNITS = ["MONTHS", "YEARS", "DAYS"] as const
export type AgeUnit = (typeof AGE_UNITS)[number]

export interface IAnimalPost {
  name: string
  species: string
  age: number
  ageUnit: AgeUnit
  weight: number
  vaccines: string
  illnesses: string
  status: boolean
  isAdopted: boolean
  owner: Types.ObjectId
  publishedAt: Date
  returnDate: Date
  imagePath: string
  createdAt: Date
  updatedAt: Date
}

export type AnimalPostDocument = HydratedDocument<IAnimalPost>

export interface PopulatedOwnerFields {
  _id: Types.ObjectId
  name: string
  email: string
  phone: string
}

export type PopulatedAnimalPostDocument = Omit<IAnimalPost, "owner"> & {
  _id: Types.ObjectId
  __v?: number
  owner: PopulatedOwnerFields
}

export interface CreateAnimalPostRepositoryDTO {
  name: string
  species: string
  age: number
  ageUnit: AgeUnit
  weight: number
  vaccines: string
  illnesses: string
  owner: Types.ObjectId
  imagePath: string
}

export interface CreateAnimalPostDTO {
  name: string
  species: string
  age: number
  ageUnit: AgeUnit
  weight: number
  vaccines?: string | undefined
  illnesses?: string | undefined
  imagePath: string
}

export interface UpdateAnimalPostDTO {
  name?: string | undefined
  species?: string | undefined
  age?: number | undefined
  ageUnit?: AgeUnit | undefined
  weight?: number | undefined
  vaccines?: string | undefined
  illnesses?: string | undefined
  imagePath?: string | undefined
}

export interface AnimalPostPublicResponse {
  id: string
  name: string
  species: string
  age: number
  ageUnit: AgeUnit
  weight: number
  vaccines: string
  illnesses: string
  status: boolean
  publishedAt: Date
  returnDate: Date
  imagePath: string
  owner: PublicOwnerSummary
  createdAt: Date
  updatedAt: Date
}

export interface AnimalPostOwnerResponse {
  id: string
  name: string
  species: string
  age: number
  ageUnit: AgeUnit
  weight: number
  vaccines: string
  illnesses: string
  status: boolean
  isAdopted: boolean
  ownerId: string
  publishedAt: Date
  returnDate: Date
  imagePath: string
  createdAt: Date
  updatedAt: Date
}
