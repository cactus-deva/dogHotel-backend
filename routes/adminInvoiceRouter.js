import express from "express";
import {
  authenticateToken,
} from "../middleware/authMiddleware.js";
import {
  deleteInvoiceById,
  getAllInvoices,
  updateInvoiceById,
} from "../controllers/adminInvoiceController.js";
import { authenticateAdmin } from "../middleware/authAdmin.js";

const adminInvoiceRouter = express.Router();

adminInvoiceRouter.use(authenticateAdmin);
adminInvoiceRouter
  .get("/", authenticateToken, getAllInvoices)
  .patch("/:invoiceId", authenticateToken, updateInvoiceById)
  .delete("/:invoiceId", authenticateToken, deleteInvoiceById);

export default adminInvoiceRouter;
