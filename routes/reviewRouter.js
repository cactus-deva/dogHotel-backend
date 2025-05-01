import express from "express";
import {
  authenticateToken,
  authorizeSelf,
} from "../middleware/authMiddleware.js";
import { createReview, deleteReviewById, getReviewByUserId, updateReviewById } from "../controllers/reviewController.js";


const reviewRouter = express.Router();

reviewRouter.route("/create").post(authenticateToken, createReview);
reviewRouter
  .route("/profile/:id")
  .get(authenticateToken, authorizeSelf, getReviewByUserId)
  .patch(authenticateToken, updateReviewById)
  .delete(authenticateToken, deleteReviewById);

export default reviewRouter;