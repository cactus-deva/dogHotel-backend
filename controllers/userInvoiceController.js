import pool from "../db/connect.js";

export const getMyInvoices = async (req,res) => {
    try {
        const userId = req.user.id
        const sql = `SELECT invoices.id AS invoice_id,
        invoices.issue_date,
        invoices.total_price,
        invoices.payment_status,
        invoices.payment_method,
        invoices.note
        FROM invoices
        JOIN bookings ON invoices.booking_id = bookings.id
        WHERE bookings.user_id = $1
        ORDER BY invoices.issue_date DESC`

        const response = await pool.query(sql, [userId])

        res.status(200).json({message: "Get My Invoices Successfully", data: response.rows})
    } catch (error) {
        console.error(error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

