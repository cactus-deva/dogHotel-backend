import pool from "../db/connect.js";

//สร้าง invoice
export const createInvoice = async (req, res) => {
  try {
    const { booking_id } = req.body;
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
      return res.status(404).json({ message: "Booking Not Found" });
    }

    const booking = result.rows[0];

    // คำนวนจำนวนคืน
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const numNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (numNights <= 0) {
      return res
        .status(400)
        .json({ message: "Invalid check-in / check-out dates" });
    }

    const totalPrice = numNights * parseFloat(booking.price_per_night);

    //เช็คว่า booking นี้มี invoice รึยัง
    const checkInvoiceSql = `SELECT * FROM invoices WHERE booking_id = $1`;
    const checkInvoice = await pool.query(checkInvoiceSql, [booking_id]);

    if (checkInvoice.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "Invoice already exists for this booking" });
    }

    //ถ้าผ่านหมดก็สร้าง invoice ใหม่โลดด
    const insertSql = `INSERT INTO invoices (booking_id, total_price)
      VALUES ($1, $2) RETURNING *`;

    const response = await pool.query(insertSql, [booking_id, totalPrice]);
    res
      .status(200)
      .json({
        message: "Invoice Created Successfully",
        data: response.rows[0],
      });
  } catch (error) {
    console.error("Create Invoice Error:", error.message);
    res.status(500).json({
      message: "Failed to create invoice",
      error: error.message,
    });
  }
};

// Get All Invoices filer/search by query params
export const getAllInvoices = async (req, res) => {
  try {
    const {invoice_id, booking_id, issue_date, payment_status, start_date, end_date} = req.query

    let sql = `
        SELECT 
        invoices.id AS invoice_id,
        TO_CHAR(invoices.issue_date,'DD-MM-YYYY') AS issue_date,
        invoices.total_price,
        invoices.payment_status,
        invoices.payment_method,
        invoices.note,

        bookings.id AS booking_id,
        TO_CHAR(bookings.check_in, 'DD-MM-YYYY') AS check_in,
        TO_CHAR(bookings.check_out, 'DD-MM-YYYY') AS check_out,

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
    const result = await pool.query(sql,values);

    res
      .status(200)
      .json({ message: "Get All Invoices Successfully", data: result.rows });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Update Invoice (status, payment method, note)
export const updateInvoiceById = async (req, res) => {
  const { id } = req.params;
  const { payment_status, payment_method, note } = req.body;

  try {
    const sql = `
        UPDATE invoices
        SET payment_status = $1,
            payment_method = $2,
            note = $3
        WHERE id = $4
        RETURNING *;
      `;
    const result = await pool.query(sql, [
      payment_status,
      payment_method,
      note,
      id,
    ]);

    if (result.rowCount > 0) {
      res
        .status(200)
        .json({
          message: "Invoice Updated Successfully",
          data: result.rows[0],
        });
    } else {
      res.status(404).json({ message: "Invoice Not Found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Delete Invoice
export const deleteInvoiceById = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `DELETE FROM invoices WHERE id = $1`;
    const result = await pool.query(sql, [id]);

    if (result.rowCount > 0) {
      res.status(200).json({ message: "Invoice Deleted Successfully" });
    } else {
      res.status(404).json({ message: "Invoice Not Found" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
