import {
  deleteInvoiceByInvoiceId,
  getAllUserInvoices,
  updateInvoiceByInvoiceId,
} from "../services/adminInvoiceService.js";
import {
  checkInvoiceExist,
  checkInvoiceIsNum,
} from "../utils/invoiceHelpers.js";

// Get All Invoices filer/search by query params
export const getAllInvoices = async (req, res, next) => {
  try {
    const {
      invoice_id,
      booking_id,
      issue_date,
      payment_status,
      start_date,
      end_date,
    } = req.query;

    const allUserInvoices = await getAllUserInvoices({
      invoice_id,
      booking_id,
      issue_date,
      payment_status,
      start_date,
      end_date,
    });

    res.status(200).json({
      message: "Get All Invoices Successfully",
      data: allUserInvoices,
    });
  } catch (error) {
    next(error);
  }
};

// Update Invoice (status, payment method, note)
export const updateInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = checkInvoiceIsNum(req.params.invoiceId);
    const { payment_status, payment_method, note } = req.body;

    await checkInvoiceExist(invoiceId);

    const updateInvoice = await updateInvoiceByInvoiceId(invoiceId, {
      payment_status,
      payment_method,
      note,
    });

    res.status(200).json({
      message: "Invoice Updated Successfully",
      data: updateInvoice,
    });
  } catch (error) {
    next(error);
  }
};

// Delete Invoice
export const deleteInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = checkInvoiceIsNum(req.params.invoiceId)
    await checkInvoiceExist(invoiceId)
    await deleteInvoiceByInvoiceId(invoiceId);

    res.status(200).json({ message: "Invoice Deleted Successfully" });
  } catch (error) {
    next(error);
  }
};
