import { randomUUID } from "node:crypto"
import os from "node:os"
import cron, { type RunCoordinator, type ScheduledTask } from "node-cron"
import { JobLockModel } from "../models/job-lock.model.js"
import type { AnimalPostRepository } from "../repositories/animal-post.repository.js"

const DEACTIVATE_JOB_NAME = "deactivate-expired-animal-posts"
const DAILY_MIDNIGHT_CRON = "0 0 * * *"
const DISTRIBUTED_LEASE_MS = 5 * 60 * 1000

const INSTANCE_ID = `${os.hostname()}-${process.pid}-${randomUUID().slice(0, 8)}`

const mongoRunCoordinator: RunCoordinator = {
  async shouldRun(key: string, ttlMs: number): Promise<boolean> {
    const now = new Date()
    const lockedUntil = new Date(now.getTime() + ttlMs)

    try {
      const lock = await JobLockModel.findOneAndUpdate(
        {
          key,
          lockedUntil: { $lte: now },
        },
        {
          $set: {
            lockedUntil,
            lockedBy: INSTANCE_ID,
          },
          $setOnInsert: {
            key,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        },
      ).exec()

      return Boolean(lock)
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        return false
      }

      console.error("[Job:DeactivateExpiredPosts] Coordinator lock error:", error)
      return false
    }
  },
}

export function startDeactivateExpiredPostsJob(
  animalPostRepository: AnimalPostRepository,
): ScheduledTask {
  const task = cron.schedule(
    DAILY_MIDNIGHT_CRON,
    async () => {
      try {
        const modifiedCount =
          await animalPostRepository.deactivateExpiredPosts()
        console.log(
          `[Job:DeactivateExpiredPosts] Executed successfully. Deactivated posts: ${modifiedCount}`,
        )
      } catch (error: unknown) {
        console.error(
          "[Job:DeactivateExpiredPosts] Failed to deactivate expired posts:",
          error,
        )
      }
    },
    {
      name: DEACTIVATE_JOB_NAME,
      noOverlap: true,
      distributed: true,
      runCoordinator: mongoRunCoordinator,
      distributedLease: DISTRIBUTED_LEASE_MS,
    },
  )

  console.log(
    `[Job:DeactivateExpiredPosts] Scheduled daily at midnight (${DAILY_MIDNIGHT_CRON})`,
  )

  return task
}
