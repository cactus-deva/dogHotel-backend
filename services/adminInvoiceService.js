import pool from "../db/connect.js";

export const createNewInvoice = async ({booking_id}) => {
    const sql = `SELECT
      b.id AS booking_id,
      b.check_in,
      b.check_out,
      b.user_id,
      hr.price_per_night
      FROM bookings b
      JOIN hotelrooms hr ON b.hotelroom_id = hr.id
      WHERE b.id = $1`;

    const result = await pool.query(sql, [booking_id]);

    if (result.rowCount === 0) {
        const error = new Error("Booking not found")
        error.status = 404
        throw error
    }

    const booking = result.rows[0];

    // คำนวนจำนวนคืน
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const numNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (numNights <= 0) {
        const error = new Error("Invalid check-in / check-out dates")
        error.status = 400
        throw error
    }

    const totalPrice = numNights * parseFloat(booking.price_per_night);

    //เช็คว่า booking นี้มี invoice รึยัง
    const checkInvoiceSql = `SELECT * FROM invoices WHERE booking_id = $1`;
    const checkInvoice = await pool.query(checkInvoiceSql, [booking_id]);

    if (checkInvoice.rowCount > 0) {
        const error = new Error("Invoice already exists for this booking")
        error.status = 400
        throw error
    }

    //ถ้าผ่านหมดก็สร้าง invoice ใหม่โลดด
    const insertSql = `INSERT INTO invoices (booking_id, total_price)
      VALUES ($1, $2) RETURNING *`;

    const response = await pool.query(insertSql, [booking_id, totalPrice]);
    return response.rows[0]
}


export const getAllUserInvoices = async ({invoice_id, booking_id, issue_date, payment_status, start_date, end_date}) => {
    let sql = `
        SELECT 
        invoices.id AS invoice_id,
        invoices.issue_date AS issue_date,
        invoices.total_price,
        invoices.payment_status,
        invoices.payment_method,
        invoices.note,
        bookings.id AS booking_id,
        bookings.check_in AS check_in,
        bookings.check_out AS check_out,

        users.first_name || ' ' || users.last_name AS owner_name,
        dogs.name AS dog_name,
        hotelrooms.name AS room_name,
        hotelrooms.size AS room_size,
        hotelrooms.price_per_night

      FROM invoices
      JOIN bookings ON invoices.booking_id = bookings.id
      JOIN users ON bookings.user_id = users.id
      JOIN dogs ON bookings.dog_id = dogs.id
      JOIN hotelrooms ON bookings.hotelroom_id = hotelrooms.id
      `;

      let filters = []
      let values = []

    if(invoice_id) {
      filters.push(`invoices.id = $${filters.length + 1}`)
      values.push(parseInt(invoice_id))
    }
    if(booking_id) {
      filters.push(`invoices.booking_id = $${filters.length + 1}`)
      values.push(parseInt(booking_id))
    }
    if(issue_date) {
      filters.push(`DATE(invoices.issue_date) = $${filters.length + 1}`)
      values.push(issue_date.trim())
    }
    if(payment_status) {
      filters.push(`LOWER(invoices.payment_status) = LOWER($${filters.length + 1})`)
      values.push(payment_status.trim())
    }
    if (start_date && end_date) {
      filters.push(`invoices.issue_date >= $${filters.length + 1}::date AND invoices.issue_date < ($${filters.length + 2}::date + INTERVAL '1 day')`);
      values.push(start_date.trim(), end_date.trim());
    }

    if (start_date && !end_date) {
      filters.push(`invoices.issue_date >= $${filters.length + 1}::date`);
      values.push(start_date.trim());
    }

    if (filters.length > 0) {
      sql += ` WHERE ` + filters.join(" AND ");
    }

    sql += ` ORDER BY invoices.issue_date DESC`;
    const response = await pool.query(sql,values);

    return response.rows
}


export const updateInvoiceByInvoiceId = async (invoiceId, {payment_status, payment_method, note }) => {
    const checkInvoiceSql = `SELECT * FROM invoices WHERE id = $1`
    const checkInvoice = await pool.query(checkInvoiceSql, [invoiceId])

    if(checkInvoice.rowCount === 0) {
        const error = new Error("This invoice ID is not available")
        error.status =404
        throw error
    }
    const sql = `
        UPDATE invoices
        SET payment_status = $1,
            payment_method = $2,
            note = $3
        WHERE id = $4
        RETURNING *;
      `;
    const response = await pool.query(sql, [
      payment_status,
      payment_method,
      note,
      invoiceId
    ]);
    return response.rows[0]
}

export const deleteInvoiceByInvoiceId = async (invoiceId) => {
    const checkInvoiceSql = `SELECT * FROM invoices WHERE id = $1`
    const checkInvoice = await pool.query(checkInvoiceSql, [invoiceId])

    if(checkInvoice.rowCount === 0) {
        const error = new Error("This invoice ID is not available")
        error.status =404
        throw error
    }
    
    const sql = `DELETE FROM invoices WHERE id = $1`;
    await pool.query(sql, [invoiceId]);
}
