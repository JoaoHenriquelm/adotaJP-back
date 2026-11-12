import { Schema, model } from "mongoose"

export interface IJobLock {
  key: string
  lockedUntil: Date
  lockedBy: string
  updatedAt: Date
}

const jobLockSchema = new Schema<IJobLock>(
  {
    key: {
      type: String,
      required: true,
    },
    lockedUntil: {
      type: Date,
      required: true,
    },
    lockedBy: {
      type: String,
      required: true,
    },
  },
  {
    collection: "jobLocks",
    timestamps: { createdAt: false, updatedAt: true },
  },
)

jobLockSchema.index({ key: 1 }, { unique: true })

export const JobLockModel = model<IJobLock>("JobLock", jobLockSchema)
