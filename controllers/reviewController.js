import { createReviewService, deleteReviewByIdService, getReviewByUserIdService, updateReviewByIdService } from "../services/reviewService.js";

export const createReview = async (req, res) => {
  try {
    const { user_id, booking_id, rating, comment } = req.body;
    const newReview = await createReviewService({user_id, booking_id, rating, comment})

    res
      .status(200)
      .json({ message: "Review Created Successfully", data: newReview });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message });
  }
};


export const getReviewByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const userReviews = await getReviewByUserIdService(userId)
    res
      .status(200)
      .json({
        message: "Get user's reviews successfully",
        data: userReviews,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get reviews", error: error.message });
  }
};

export const updateReviewById = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    const updateReview = await updateReviewByIdService(reviewId, userId, {rating, comment})
    res
      .status(200)
      .json({ message: "Review updated successfully", data: updateReview });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message });
  }
};

export const deleteReviewById = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user.id;

    await deleteReviewByIdService(reviewId, userId)
    res.status(200).json({ message: "Review Deleted Successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message });
  }
};
