import express from "express";
import { authenticateToken, authorizeSelf } from "../middleware/authMiddleware.js";
import {
  cancelBookingById,
  createBookingAndInvoice,
  getMyBookings,
  updateBookingById,
  getAvailableRoomsBySize
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter.route("/create").post(authenticateToken, createBookingAndInvoice)
bookingRouter.route("/available").get(authenticateToken, getAvailableRoomsBySize)
bookingRouter
  .route("/:id")
  .get(authenticateToken,authorizeSelf, getMyBookings)
  .patch(authenticateToken, updateBookingById)
  .delete(authenticateToken, cancelBookingById);

export default bookingRouter;
