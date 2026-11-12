import { Schema, model } from "mongoose"
import type { IUser } from "../types/user.types.js"

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    cpf: {
      type: String,
      required: true,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    favoriteAnimals: {
      type: [{ type: Schema.Types.ObjectId, ref: "AnimalPost" }],
      default: () => [],
    },
  },
  {
    collection: "users",
    timestamps: true,
  },
)

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ cpf: 1 }, { unique: true })

export const UserModel = model<IUser>("User", userSchema)
