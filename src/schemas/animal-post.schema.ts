import { z } from "zod"
import { AGE_UNITS } from "../types/animal-post.types.js"
import { normalizeSpecies } from "../utils/species.util.js"
import { paginationQuerySchema } from "./common.schema.js"

const ageUnitSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.trim().toUpperCase() : val),
  z.enum(AGE_UNITS, {
    message: "A unidade da idade deve ser MONTHS ou YEARS.",
  }),
)

export const listAnimalPostsQuerySchema = paginationQuerySchema.extend({
  species: z
    .string()
    .trim()
    .min(1, "A espécie não pode ser vazia.")
    .transform(normalizeSpecies)
    .optional(),
})

export const createAnimalPostSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "O nome do animal é obrigatório.")
      .max(100, "O nome do animal deve ter no máximo 100 caracteres."),
    species: z
      .string()
      .trim()
      .min(1, "A espécie do animal é obrigatória.")
      .max(60, "A espécie deve ter no máximo 60 caracteres.")
      .transform(normalizeSpecies),
    age: z.coerce
      .number({ message: "A idade deve ser um número válido." })
      .min(0, "A idade não pode ser negativa.")
      .max(200, "Idade inválida."),
    ageUnit: ageUnitSchema,
    weight: z.coerce
      .number({ message: "O peso deve ser um número válido." })
      .positive("O peso deve ser maior que zero.")
      .max(2000, "Peso inválido."),
    vaccines: z
      .string()
      .trim()
      .max(1000, "Vacinas deve ter no máximo 1000 caracteres.")
      .optional()
      .default(""),
    illnesses: z
      .string()
      .trim()
      .max(1000, "Enfermidades deve ter no máximo 1000 caracteres.")
      .optional()
      .default(""),
    imagePath: z
      .string()
      .trim()
      .min(1, "A imagem do animal é obrigatória.")
      .max(2048, "Caminho da imagem inválido."),
  })
  .strict()

export const updateAnimalPostSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "O nome do animal não pode ser vazio.")
      .max(100, "O nome do animal deve ter no máximo 100 caracteres.")
      .optional(),
    species: z
      .string()
      .trim()
      .min(1, "A espécie não pode ser vazia.")
      .max(60, "A espécie deve ter no máximo 60 caracteres.")
      .transform(normalizeSpecies)
      .optional(),
    age: z.coerce
      .number({ message: "A idade deve ser um número válido." })
      .min(0, "A idade não pode ser negativa.")
      .max(200, "Idade inválida.")
      .optional(),
    ageUnit: ageUnitSchema.optional(),
    weight: z.coerce
      .number({ message: "O peso deve ser um número válido." })
      .positive("O peso deve ser maior que zero.")
      .max(2000, "Peso inválido.")
      .optional(),
    vaccines: z
      .string()
      .trim()
      .max(1000, "Vacinas deve ter no máximo 1000 caracteres.")
      .optional(),
    illnesses: z
      .string()
      .trim()
      .max(1000, "Enfermidades deve ter no máximo 1000 caracteres.")
      .optional(),
    imagePath: z
      .string()
      .trim()
      .min(1, "O caminho da imagem não pode ser vazio.")
      .max(2048, "Caminho da imagem inválido.")
      .optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "Informe ao menos um campo permitido para atualização.",
  })

export const adoptAnimalPostBodySchema = z
  .object({
    isAdopted: z
      .boolean({
        message: "O campo isAdopted deve ser booleano (true ou false).",
      })
      .optional(),
  })
  .strict()
  .optional()
