import express from "express";
import {
  authenticateToken,
  authorizeSelf,
} from "../middleware/authMiddleware.js";
import {
  createReview,
  deleteReviewById,
  getReviewByUserId,
  updateReviewById,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter
  .post("/create", authenticateToken, createReview)
  .get("/profile/:id", authenticateToken, authorizeSelf, getReviewByUserId)
  .patch("/profile/:id", authenticateToken, updateReviewById)
  .delete("/profile/:id", authenticateToken, deleteReviewById);

export default reviewRouter;
