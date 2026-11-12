import { z } from "zod"

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "O nome deve ter pelo menos 2 caracteres.")
      .max(120, "O nome deve ter no máximo 120 caracteres."),
    email: z.email("E-mail inválido.").trim().toLowerCase(),
    cpf: z
      .string()
      .trim()
      .transform((val) => val.replace(/\D/g, ""))
      .refine((digits) => /^\d{11}$/.test(digits), {
        message: "O CPF deve conter exatamente 11 dígitos numéricos.",
      }),
    birthDate: z.coerce
      .date({ message: "Data de nascimento inválida." })
      .refine((date) => date <= new Date(), {
        message: "A data de nascimento não pode ser futura.",
      }),
    phone: z
      .string()
      .trim()
      .min(8, "O telefone deve ter pelo menos 8 caracteres.")
      .max(25, "O telefone deve ter no máximo 25 caracteres."),
    address: z
      .string()
      .trim()
      .min(3, "O endereço deve ter pelo menos 3 caracteres.")
      .max(255, "O endereço deve ter no máximo 255 caracteres."),
    password: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres.")
      .max(128, "A senha deve ter no máximo 128 caracteres."),
  })
  .strict()

export const loginSchema = z
  .object({
    email: z.email("E-mail inválido.").trim().toLowerCase(),
    password: z.string().min(1, "A senha é obrigatória."),
  })
  .strict()
