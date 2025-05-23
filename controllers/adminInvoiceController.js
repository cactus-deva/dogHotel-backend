import {
  createNewInvoice,
  deleteInvoiceByInvoiceId,
  getAllUserInvoices,
  updateInvoiceByInvoiceId,
} from "../services/adminInvoiceService.js";

//สร้าง invoice
export const createInvoice = async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) {
      const error = new Error("Invalid Booking ID");
      error.status = 400;
      throw error;
    }
    const newInvoice = await createNewInvoice({ booking_id });
    res.status(200).json({
      message: "Invoice Created Successfully",
      data: newInvoice,
    });
  } catch (error) {
    next(error);
  }
};

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
  const invoiceId = parseInt(req.params.invoiceId, 10);
  const { payment_status, payment_method, note } = req.body;

  if (isNaN(invoiceId)) {
    const error = new Error("Invoice ID invalid type or Invalid invoice ID");
    error.status = 400;
    throw error;
  }

  try {
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
  const invoiceId = parseInt(req.params.invoiceId);

  if (isNaN(invoiceId)) {
    const error = new Error("Invoice ID invalid type or Invalid invoice ID");
    error.status = 400;
    throw error;
  }

  try {
    await deleteInvoiceByInvoiceId(invoiceId);

    res.status(200).json({ message: "Invoice Deleted Successfully" });
  } catch (error) {
    next(error);
  }
};
