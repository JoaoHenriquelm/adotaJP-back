import { Types } from "mongoose"
import { z } from "zod"

export const objectIdSchema = z
  .string()
  .trim()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Identificador inválido.",
  })

export const idParamSchema = z.object({
  id: objectIdSchema,
})

export const animalPostIdParamSchema = z.object({
  animalPostId: objectIdSchema,
})

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "A página mínima é 1.").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "O limite mínimo é 1.")
    .max(100, "O limite máximo é 100.")
    .default(10),
})
