import express from "express";
import {
  authenticateToken
} from "../middleware/authMiddleware.js";
import {
  createDog,
  deleteDogById,
  getMyDogs,
  updateDogById,
} from "../controllers/dogController.js";

const dogRouter = express.Router();
//Dogs Table
dogRouter.route("/create").post(authenticateToken, createDog);
dogRouter
  .route("/me")
  .get(authenticateToken, getMyDogs)

  dogRouter.route("/:id")
  .patch(authenticateToken, updateDogById)
  .delete(authenticateToken, deleteDogById);

export default dogRouter;
