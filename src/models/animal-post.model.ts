import { Schema, model } from "mongoose"
import { AGE_UNITS, type IAnimalPost } from "../types/animal-post.types.js"
import { normalizeSpecies } from "../utils/species.util.js"

const animalPostSchema = new Schema<IAnimalPost>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    species: {
      type: String,
      required: true,
      set: normalizeSpecies,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    ageUnit: {
      type: String,
      required: true,
      enum: AGE_UNITS,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    vaccines: {
      type: String,
      default: "",
      trim: true,
    },
    illnesses: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: Boolean,
      required: true,
      default: true,
    },
    isAdopted: {
      type: Boolean,
      required: true,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      immutable: true,
    },
    returnDate: {
      type: Date,
      required: true,
    },
    imagePath: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    collection: "animalPosts",
    timestamps: true,
  },
)

animalPostSchema.index({ owner: 1 })
animalPostSchema.index({ status: 1, publishedAt: -1 })
animalPostSchema.index({ species: 1, status: 1, publishedAt: -1 })
animalPostSchema.index({ returnDate: 1, status: 1 })

export const AnimalPostModel = model<IAnimalPost>("AnimalPost", animalPostSchema)
