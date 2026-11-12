import { randomUUID } from "node:crypto"
import { createWriteStream } from "node:fs"
import { mkdir, unlink } from "node:fs/promises"
import path from "node:path"
import { pipeline } from "node:stream/promises"
import type { MultipartFile } from "@fastify/multipart"
import { env } from "../config/env.js"
import { AppError } from "../errors/app-error.js"

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
}

export class StorageService {
  private readonly uploadDirPath: string

  constructor() {
    this.uploadDirPath = path.resolve(process.cwd(), env.UPLOAD_DIR)
  }

  getUploadDirPath(): string {
    return this.uploadDirPath
  }

  async saveAnimalImage(part: MultipartFile): Promise<string> {
    const extension = MIME_TO_EXTENSION[part.mimetype]
    if (!extension) {
      part.file.resume()
      throw new AppError(
        "Formato de imagem inválido. Utilize JPEG, PNG, WEBP ou GIF.",
        400,
        "INVALID_IMAGE_FORMAT",
      )
    }

    await mkdir(this.uploadDirPath, { recursive: true })

    const fileName = `${randomUUID()}${extension}`
    const destinationPath = path.join(this.uploadDirPath, fileName)

    await pipeline(part.file, createWriteStream(destinationPath))

    if (part.file.truncated) {
      await unlink(destinationPath).catch(() => undefined)
      throw new AppError(
        "A imagem excede o tamanho máximo permitido.",
        413,
        "IMAGE_TOO_LARGE",
      )
    }

    return `/${env.UPLOAD_DIR}/${fileName}`
  }

  async removeLocalImageIfOwned(imagePath: string): Promise<void> {
    const prefix = `/${env.UPLOAD_DIR}/`
    if (!imagePath.startsWith(prefix)) {
      return
    }

    const fileName = path.basename(imagePath.slice(prefix.length))
    if (!fileName) {
      return
    }

    const fullPath = path.join(this.uploadDirPath, fileName)
    await unlink(fullPath).catch(() => undefined)
  }
}
