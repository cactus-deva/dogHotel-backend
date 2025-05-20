import express from "express";
import {
  authenticateToken,
  authorizeSelf,
} from "../middleware/authMiddleware.js";
import {
  cancelBookingById,
  createBookingAndInvoice,
  getMyBookings,
  updateBookingById,
  getAvailableRoomsBySize,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();

bookingRouter
  .post("/create", authenticateToken, createBookingAndInvoice)
  .get("/available", authenticateToken, getAvailableRoomsBySize)
  .get("/:id", authenticateToken, authorizeSelf, getMyBookings)
  .patch("/:id", authenticateToken, updateBookingById)
  .delete("/:id", authenticateToken, cancelBookingById);

export default bookingRouter;
