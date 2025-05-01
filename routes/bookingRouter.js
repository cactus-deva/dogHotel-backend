import express from "express";
import { authenticateToken, authorizeSelf } from "../middleware/authMiddleware.js";
import {
  createBooking,
  deleteBookingById,
  getMyBookings,
  updateBookingById,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.route("/create").post(authenticateToken, createBooking)
bookingRouter
  .route("/:id")
  .get(authenticateToken,authorizeSelf, getMyBookings)
  .patch(authenticateToken, updateBookingById)
  .delete(authenticateToken, deleteBookingById);

export default bookingRouter;
