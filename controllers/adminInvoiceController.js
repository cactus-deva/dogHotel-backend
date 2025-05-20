
import {
  createNewInvoice,
  deleteInvoiceByInvoiceId,
  getAllUserInvoices,
  updateInvoiceByInvoiceId,
} from "../services/adminInvoiceService.js";

//สร้าง invoice
export const createInvoice = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const newInvoice = await createNewInvoice({ booking_id });
    res.status(200).json({
      message: "Invoice Created Successfully",
      data: newInvoice,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get All Invoices filer/search by query params
export const getAllInvoices = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// Update Invoice (status, payment method, note)
export const updateInvoiceById = async (req, res) => {
  const invoiceId = parseInt(req.params.invoiceId, 10);
  const { payment_status, payment_method, note } = req.body;

  if (isNaN(invoiceId)) {
    res.status(400).json({ message: "Parameter invalid type" });
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
    res.status(500).json({ message: error.message });
  }
};

// Delete Invoice
export const deleteInvoiceById = async (req, res) => {
  const invoiceId = parseInt(req.params.invoiceId);

  if (isNaN(invoiceId)) {
    res.status(400).json({ message: "Parameter invalid type" });
  }

  try {
    await deleteInvoiceByInvoiceId(invoiceId);

    res.status(200).json({ message: "Invoice Deleted Successfully" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message });
  }
};
