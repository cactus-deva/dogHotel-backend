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

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter
  .route("/profile/:id")
  .get(authenticateToken, authorizeSelf, getUserById)
  .patch(authenticateToken, authorizeSelf, updateUserById);

export default userRouter;
