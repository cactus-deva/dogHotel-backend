import { getInvoiceByUserId } from "../services/userInvoiceService.js";

export const getMyInvoices = async (req, res,next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      const error = new Error("Invalid User ID");
      error.status = 400;
      throw error;
    }
    const myInvoice = await getInvoiceByUserId(userId);

    res
      .status(200)
      .json({ message: "Get My Invoices Successfully", data: myInvoice });
  } catch (error) {
    next(error)
  }
};
