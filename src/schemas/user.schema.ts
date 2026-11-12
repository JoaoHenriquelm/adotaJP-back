import { z } from "zod"

export const updateUserContactSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(8, "O telefone deve ter pelo menos 8 caracteres.")
      .max(25, "O telefone deve ter no máximo 25 caracteres.")
      .optional(),
    address: z
      .string()
      .trim()
      .min(3, "O endereço deve ter pelo menos 3 caracteres.")
      .max(255, "O endereço deve ter no máximo 255 caracteres.")
      .optional(),
  })
  .strict()
  .refine((data) => data.phone !== undefined || data.address !== undefined, {
    message: "Informe ao menos o telefone ou o endereço para atualização.",
  })
