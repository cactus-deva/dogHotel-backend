import express from "express";
import {
  authenticateToken
} from "../middleware/authMiddleware.js";
import { getMyInvoices } from "../controllers/userInvoiceController.js";



const userInvoiceRouter = express.Router();

userInvoiceRouter.route("/me").get(authenticateToken, getMyInvoices);


export default userInvoiceRouter;