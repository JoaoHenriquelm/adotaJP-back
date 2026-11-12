import type { FastifyInstance } from "fastify"
import type { AnimalPostController } from "../controllers/animal-post.controller.js"
import { authenticateMiddleware } from "../middlewares/auth.middleware.js"

export function createAnimalPostRoutes(
  animalPostController: AnimalPostController,
) {
  return async function animalPostRoutes(app: FastifyInstance): Promise<void> {
    app.get("/", animalPostController.listAvailable)
    app.get("/:id", animalPostController.getById)

    app.post(
      "/",
      { preHandler: [authenticateMiddleware] },
      animalPostController.create,
    )
    app.patch(
      "/:id",
      { preHandler: [authenticateMiddleware] },
      animalPostController.update,
    )
    app.patch(
      "/:id/confirm-availability",
      { preHandler: [authenticateMiddleware] },
      animalPostController.confirmAvailability,
    )
    app.patch(
      "/:id/adopt",
      { preHandler: [authenticateMiddleware] },
      animalPostController.adopt,
    )
    app.delete(
      "/:id",
      { preHandler: [authenticateMiddleware] },
      animalPostController.delete,
    )
  }
}
