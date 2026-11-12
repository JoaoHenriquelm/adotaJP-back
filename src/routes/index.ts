import type { FastifyInstance } from "fastify"
import { AnimalPostController } from "../controllers/animal-post.controller.js"
import { AuthController } from "../controllers/auth.controller.js"
import { UserController } from "../controllers/user.controller.js"
import { AnimalPostRepository } from "../repositories/animal-post.repository.js"
import { UserRepository } from "../repositories/user.repository.js"
import { AnimalPostService } from "../services/animal-post.service.js"
import { AuthService } from "../services/auth.service.js"
import { StorageService } from "../services/storage.service.js"
import { UserService } from "../services/user.service.js"
import { createAnimalPostRoutes } from "./animal-post.routes.js"
import { createAuthRoutes } from "./auth.routes.js"
import { createUserRoutes } from "./user.routes.js"

export interface AppDependencies {
  userRepository: UserRepository
  animalPostRepository: AnimalPostRepository
  storageService: StorageService
}

export function createAppDependencies(): AppDependencies {
  return {
    userRepository: new UserRepository(),
    animalPostRepository: new AnimalPostRepository(),
    storageService: new StorageService(),
  }
}

export function createApiRoutes(deps: AppDependencies) {
  const authService = new AuthService(deps.userRepository)
  const userService = new UserService(
    deps.userRepository,
    deps.animalPostRepository,
  )
  const animalPostService = new AnimalPostService(
    deps.animalPostRepository,
    deps.userRepository,
    deps.storageService,
  )

  const authController = new AuthController(authService)
  const userController = new UserController(userService)
  const animalPostController = new AnimalPostController(
    animalPostService,
    deps.storageService,
  )

  return async function apiRoutes(app: FastifyInstance): Promise<void> {
    await app.register(createAuthRoutes(authController), { prefix: "/auth" })
    await app.register(createUserRoutes(userController), { prefix: "/users" })
    await app.register(createAnimalPostRoutes(animalPostController), {
      prefix: "/animal-posts",
    })
  }
}
