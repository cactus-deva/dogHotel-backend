import express from 'express'
import  {adminLogin, getAllBookings, getAllDogs, getAllReviews, getAllUsers, getAvailableRooms, registerAdmin, toggleRoomStatus } from '../controllers/adminController.js'
import { authenticateAdmin } from '../middleware/authAdmin.js'

const adminRouter = express.Router()

adminRouter.route("/register").post(registerAdmin)
adminRouter.route("/login").post(adminLogin)

adminRouter.use(authenticateAdmin)

adminRouter.route("/users").get(getAllUsers)
adminRouter.route("/dogs").get(getAllDogs)
adminRouter.route("/reviews").get(getAllReviews)
adminRouter.route("/bookings").get(getAllBookings)
adminRouter.route("/room-status").get(toggleRoomStatus)
adminRouter.route("/available-room").get(getAvailableRooms)

export default adminRouter