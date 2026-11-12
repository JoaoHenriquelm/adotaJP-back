import type { HydratedDocument, Types } from "mongoose"

export interface IUser {
  name: string
  passwordHash: string
  email: string
  cpf: string
  birthDate: Date
  phone: string
  address: string
  favoriteAnimals: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

export type UserDocument = HydratedDocument<IUser>

export interface CreateUserRepositoryDTO {
  name: string
  passwordHash: string
  email: string
  cpf: string
  birthDate: Date
  phone: string
  address: string
}

export interface RegisterUserDTO {
  name: string
  password: string
  email: string
  cpf: string
  birthDate: Date
  phone: string
  address: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface UpdateUserContactDTO {
  phone?: string | undefined
  address?: string | undefined
}

export interface UserProfileResponse {
  id: string
  name: string
  email: string
  birthDate: Date
  phone: string
  address: string
  favoriteAnimals: string[]
  createdAt: Date
  updatedAt: Date
}

export interface PublicOwnerSummary {
  id: string
  name: string
  email: string
  phone: string
}

export interface AuthTokenPayload {
  sub: string
  email: string
}

export interface LoginResponse {
  accessToken: string
  user: UserProfileResponse
}
