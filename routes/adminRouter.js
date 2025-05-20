import express from "express";
import {
  adminLogin,
  deleteUserById,
  getAllBookings,
  getAllDogs,
  getAllReviews,
  getAllUsers,
  getAvailableRooms,
  registerAdmin,
  toggleRoomStatus,
} from "../controllers/adminController.js";
import { authenticateAdmin } from "../middleware/authAdmin.js";

const adminRouter = express.Router();

adminRouter.post("/register", registerAdmin).post("/login", adminLogin);

adminRouter.use(authenticateAdmin);

adminRouter.get("/users", getAllUsers)
.delete("/users/:userId",deleteUserById)
.get("/dogs",getAllDogs)
.get("/reviews",getAllReviews)
.get("/bookings",getAllBookings)
.patch("/room-status",toggleRoomStatus)
.get("/available-room",getAvailableRooms)

export default adminRouter;
