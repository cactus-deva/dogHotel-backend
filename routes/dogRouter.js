import express from "express";
import {
  authenticateToken,
  authorizeSelf,
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
  .route("/profile/:id")
  .get(authenticateToken, authorizeSelf, getMyDogs)
  .patch(authenticateToken, updateDogById)
  .delete(authenticateToken, deleteDogById);

export default dogRouter;
