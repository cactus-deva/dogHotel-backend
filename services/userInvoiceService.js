import pool from "../db/connect.js";


export const getInvoiceByUserId = async (userId) => {
    const sql = `SELECT invoices.id AS invoice_id,
        invoices.issue_date,
        invoices.total_price,
        invoices.payment_status,
        invoices.payment_method,
        invoices.noteม
        hotelrooms.name AS room_name,
        dogs.name AS dog_name,
        bookings.check_in AS check_in,
        bookings.check_out AS check_out
        FROM invoices
        JOIN bookings ON invoices.booking_id = bookings.id
        JOIN hotelrooms ON hotelrooms.id = bookings.hotelroom_id
        JOIN dogs ON dogs.id = bookings.dog_id
        WHERE bookings.user_id = $1
        ORDER BY invoices.issue_date DESC`

        const response = await pool.query(sql, [userId])
        return response.rows
}