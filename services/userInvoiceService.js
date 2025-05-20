import pool from "../db/connect.js";


export const getInvoiceByUserId = async (userId) => {
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
        return response.rows
}