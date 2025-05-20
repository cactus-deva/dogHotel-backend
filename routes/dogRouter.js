import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import {
  createDog,
  deleteDogById,
  getMyDogs,
  updateDogById,
} from "../controllers/dogController.js";

const dogRouter = express.Router();

dogRouter
  .post("/create", authenticateToken, createDog)
  .get("/me", authenticateToken, getMyDogs)
  .patch("/:id", authenticateToken, updateDogById)
  .delete("/:id", authenticateToken, deleteDogById);

export default dogRouter;
