import {
  createReviewService,
  deleteReviewByIdService,
  getReviewByUserIdService,
  updateReviewByIdService,
} from "../services/reviewService.js";
import {
  sanitizeNumber,
  sanitizeString,
  validateMaxLength,
  validateMaxNumber,
} from "../utils/sanitizeHelper.js";

export const createReview = async (req, res, next) => {
  try {
    const user_id = sanitizeNumber(req.body.user_id);
    const booking_id = sanitizeNumber(req.body.booking_id);
    const rating = sanitizeNumber(req.body.rating);
    const comment = sanitizeString(req.body.comment || "");
    validateMaxLength(comment, 50, "comment");
    validateMaxNumber(rating, 5, "rating");

    if (!user_id || !booking_id) {
      const error = new Error("Invalid user ID or booking ID");
      error.status = 400;
      throw error;
    }

    if (!rating || !comment) {
      const error = new Error(
        "Rating must be between 1 - 5. Please input rating and comment before submit"
      );
      error.status = 400;
      throw error;
    }

    const newReview = await createReviewService({
      user_id,
      booking_id,
      rating,
      comment,
    });

    res
      .status(200)
      .json({ message: "Review Created Successfully", data: newReview });
  } catch (error) {
    next(error);
  }
};

export const getReviewByUserId = async (req, res, next) => {
  try {
    const userId = sanitizeNumber(req.params.id);
    if (!userId) {
      const error = new Error("Invalid user ID");
      error.status = 400;
      throw error;
    }

    const userReviews = await getReviewByUserIdService(userId);

    res.status(200).json({
      message: "Fetch reviews successfully",
      data: userReviews,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReviewById = async (req, res, next) => {
  try {
    const reviewId = sanitizeNumber(req.params.id);
    const userId = req.user.id;
    const rating = sanitizeNumber(req.body.rating);
    const comment = sanitizeString(req.body.comment || "");
    validateMaxLength(comment, 50, "comment");
    validateMaxNumber(rating, 5, "rating");

    if (!reviewId || !userId) {
      const error = new Error("Invalid user ID or review ID");
      error.status = 400;
      throw error;
    }
    if (rating < 0) {
      const error = new Error("please rate between 1- 5 stars");
      error.status = 400;
      throw error;
    }
    if (!rating || !comment) {
      const error = new Error("Please fill rating and comment before submit");
      error.status = 400;
      throw error;
    }

    const updateReview = await updateReviewByIdService({
      reviewId,
      userId,
      rating,
      comment,
    });
    res
      .status(200)
      .json({ message: "Review updated successfully", data: updateReview });
  } catch (error) {
    next(error);
  }
};

export const deleteReviewById = async (req, res, next) => {
  try {
    const reviewId = sanitizeNumber(req.params.id);
    const userId = req.user.id;

    if (!userId) {
      const error = new Error("Invalid user ID or review ID");
      error.status = 400;
      throw error;
    }

    await deleteReviewByIdService(reviewId, userId);
    res.status(200).json({ message: "Review Deleted Successfully" });
  } catch (error) {
    next(error);
  }
};
