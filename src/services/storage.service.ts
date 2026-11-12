import { createHash, randomUUID } from "node:crypto"
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

interface CloudinaryCredentials {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder: string
}

interface CloudinaryUploadResponse {
  secure_url?: string
  public_id?: string
  error?: {
    message?: string
  }
}

export class StorageService {
  private readonly uploadDirPath: string
  private readonly cloudinary: CloudinaryCredentials | null

  constructor() {
    this.uploadDirPath = path.resolve(process.cwd(), env.UPLOAD_DIR)

    if (
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    ) {
      this.cloudinary = {
        cloudName: env.CLOUDINARY_CLOUD_NAME,
        apiKey: env.CLOUDINARY_API_KEY,
        apiSecret: env.CLOUDINARY_API_SECRET,
        folder: env.CLOUDINARY_FOLDER,
      }
    } else {
      this.cloudinary = null
    }
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

    if (this.cloudinary) {
      return this.uploadToCloudinary(part, this.cloudinary)
    }

    return this.saveToLocalDisk(part, extension)
  }

  private async uploadToCloudinary(
    part: MultipartFile,
    credentials: CloudinaryCredentials,
  ): Promise<string> {
    const chunks: Buffer[] = []
    for await (const chunk of part.file) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    if (part.file.truncated) {
      throw new AppError(
        "A imagem excede o tamanho máximo permitido.",
        413,
        "IMAGE_TOO_LARGE",
      )
    }

    const fileBuffer = Buffer.concat(chunks)
    if (fileBuffer.length === 0) {
      throw new AppError(
        "O arquivo de imagem enviado está vazio.",
        400,
        "EMPTY_IMAGE_FILE",
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const signaturePayload = `folder=${credentials.folder}&timestamp=${timestamp}${credentials.apiSecret}`
    const signature = createHash("sha1").update(signaturePayload).digest("hex")

    const formData = new FormData()
    const dataUri = `data:${part.mimetype};base64,${fileBuffer.toString("base64")}`
    formData.append("file", dataUri)
    formData.append("api_key", credentials.apiKey)
    formData.append("timestamp", String(timestamp))
    formData.append("folder", credentials.folder)
    formData.append("signature", signature)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    })

    const result = (await response.json()) as CloudinaryUploadResponse

    if (!response.ok || !result.secure_url) {
      throw new AppError(
        result.error?.message ?? "Falha ao enviar a imagem para o Cloudinary.",
        502,
        "IMAGE_UPLOAD_FAILED",
      )
    }

    return result.secure_url
  }

  private async saveToLocalDisk(
    part: MultipartFile,
    extension: string,
  ): Promise<string> {
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
    if (this.cloudinary && imagePath.includes("res.cloudinary.com/")) {
      await this.deleteFromCloudinary(imagePath, this.cloudinary)
      return
    }

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

  private async deleteFromCloudinary(
    imageUrl: string,
    credentials: CloudinaryCredentials,
  ): Promise<void> {
    const match = /\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/.exec(
      imageUrl,
    )
    const publicId = match?.[1]
    if (!publicId) {
      return
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const signaturePayload = `public_id=${publicId}&timestamp=${timestamp}${credentials.apiSecret}`
    const signature = createHash("sha1").update(signaturePayload).digest("hex")

    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("api_key", credentials.apiKey)
    formData.append("timestamp", String(timestamp))
    formData.append("signature", signature)

    const destroyUrl = `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/destroy`
    await fetch(destroyUrl, {
      method: "POST",
      body: formData,
    }).catch(() => undefined)
  }
}
