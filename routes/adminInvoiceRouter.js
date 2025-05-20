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

adminInvoiceRouter.use(authenticateAdmin);
adminInvoiceRouter
  .post("/create", createInvoice)
  .get("/", authenticateToken, getAllInvoices)
  .patch("/:invoiceId", authenticateToken, updateInvoiceById)
  .delete("/:invoiceId", authenticateToken, deleteInvoiceById);

export default adminInvoiceRouter;
