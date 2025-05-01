import express from "express";
import {
  authenticateToken,
  authorizeSelf,
} from "../middleware/authMiddleware.js";
import {
  createInvoice,
  deleteInvoiceById,
  getAllInvoices,
  updateInvoiceById,
} from "../controllers/adminInvoiceController.js";
import { authenticateAdmin } from "../middleware/authAdmin.js";

const adminInvoiceRouter = express.Router();

adminInvoiceRouter.use(authenticateAdmin)
adminInvoiceRouter.route("/create").post(createInvoice)
adminInvoiceRouter.route("/")  .get(authenticateToken, getAllInvoices)
adminInvoiceRouter
  .route("/:id")
  .patch(authenticateToken, updateInvoiceById)
  .delete(authenticateToken, deleteInvoiceById);

export default adminInvoiceRouter;
