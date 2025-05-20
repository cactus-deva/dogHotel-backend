import express from "express";
import {
  getUserById,
  loginUser,
  registerUser,
  updateUserById,
} from "../controllers/userController.js";
import {
  authenticateToken,
  authorizeSelf,
} from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter
  .post("/register", registerUser)
  .post("/login", loginUser)
  .get("/profile/:id", authenticateToken, authorizeSelf, getUserById)
  .patch("/profile/:id", authenticateToken, authorizeSelf, updateUserById);

export default userRouter;
