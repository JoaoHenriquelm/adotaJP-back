import bcrypt from "bcryptjs"
import jwt, { type SignOptions } from "jsonwebtoken"
import { env } from "../config/env.js"
import { AppError } from "../errors/app-error.js"
import type { UserRepository } from "../repositories/user.repository.js"
import type {
  AuthTokenPayload,
  LoginDTO,
  LoginResponse,
  RegisterUserDTO,
  UserProfileResponse,
} from "../types/user.types.js"
import { toUserProfileResponse } from "../utils/mappers.util.js"

const BCRYPT_SALT_ROUNDS = 12
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-protection", 10)

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async register(data: RegisterUserDTO): Promise<UserProfileResponse> {
    const [existingByEmail, existingByCpf] = await Promise.all([
      this.userRepository.findByEmail(data.email),
      this.userRepository.findByCpf(data.cpf),
    ])

    if (existingByEmail) {
      throw new AppError(
        "Este e-mail já está cadastrado.",
        409,
        "EMAIL_ALREADY_EXISTS",
      )
    }

    if (existingByCpf) {
      throw new AppError(
        "Este CPF já está cadastrado.",
        409,
        "CPF_ALREADY_EXISTS",
      )
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS)

    const createdUser = await this.userRepository.store({
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      birthDate: data.birthDate,
      phone: data.phone,
      address: data.address,
      passwordHash,
    })

    return toUserProfileResponse(createdUser)
  }

  async login(data: LoginDTO): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(data.email)

    if (!user) {
      await bcrypt.compare(data.password, DUMMY_PASSWORD_HASH)
      throw new AppError(
        "Credenciais inválidas.",
        401,
        "INVALID_CREDENTIALS",
      )
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new AppError(
        "Credenciais inválidas.",
        401,
        "INVALID_CREDENTIALS",
      )
    }

    const payload: AuthTokenPayload = {
      sub: user._id.toString(),
      email: user.email,
    }

    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
    }

    const accessToken = jwt.sign(payload, env.JWT_SECRET, signOptions)

    return {
      accessToken,
      user: toUserProfileResponse(user),
    }
  }
}
