import { getInvoiceByUserId } from "../services/userInvoiceService.js";

export const getMyInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const myInvoice = await getInvoiceByUserId(userId);

    res
      .status(200)
      .json({ message: "Get My Invoices Successfully", data: myInvoice });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
