import type { FastifyInstance } from "fastify"
import type { UserController } from "../controllers/user.controller.js"
import { authenticateMiddleware } from "../middlewares/auth.middleware.js"

export function createUserRoutes(userController: UserController) {
  return async function userRoutes(app: FastifyInstance): Promise<void> {
    app.addHook("preHandler", authenticateMiddleware)

    app.get("/me", userController.getMe)
    app.patch("/me", userController.updateMe)
    app.get("/me/favorites", userController.listFavorites)
    app.post("/me/favorites/:animalPostId", userController.addFavorite)
    app.delete("/me/favorites/:animalPostId", userController.removeFavorite)
    app.get("/me/animal-posts", userController.listMyAnimalPosts)
  }
}
