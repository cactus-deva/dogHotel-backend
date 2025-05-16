import pool from "../db/connect.js";

export const createBookingAndInvoice = async (req, res) => {
  const userId = req.user.id;
  const { dog_id, hotelroom_id, check_in, check_out } = req.body;

  try {
    //check date
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);

    if (today > checkInDate) {
      return res
        .status(400)
        .json({ message: "The selected date already passed" });
    }

    if (checkInDate >= checkOutDate) {
      return res
        .status(400)
        .json({ message: "Invalid check-in / check-out dates" });
    }

    //check dog belongs to user
    const checkDogSql = `SELECT name FROM dogs WHERE id = $1 AND user_id = $2`;
    const dogResult = await pool.query(checkDogSql, [dog_id, userId]);
    if (dogResult.rowCount === 0) {
      return res.status(403).json({ message: "You do not owon this dog" });
    }

    const dogName = dogResult.rows[0].name;

    //check room has duplicate booking
    const checkRoomSql = `SELECT * from Bookings WHERE hotelroom_id = $1 AND check_in = $2 AND check_out = $3`;
    const checkRoom = await pool.query(checkRoomSql, [
      hotelroom_id,
      check_in,
      check_out,
    ]);
    console.log(checkRoom.rows);
    if (checkRoom.rowCount > 0) {
      return res
        .status(409)
        .json({ message: "Room already booked for this period" });
    }

    //check dog has duplicate booking
    const checkDogBookingSql = `SELECT * from bookings WHERE dog_id = $1 AND status = 'confirmed' AND check_in <= $3 AND check_out >= $2`;
    const checkDogBooking = await pool.query(checkDogBookingSql, [
      dog_id,
      check_in,
      check_out,
    ]);

    if (checkDogBooking.rowCount > 0) {
      return res
        .status(409)
        .json({ message: "This dog already has a booking during this period" });
    }

    //get hotelroom price
    const hotelroomPriceSql = `SELECT price_per_night FROM hotelrooms WHERE id = $1`;
    const hotelroomPrice = await pool.query(hotelroomPriceSql, [hotelroom_id]);
    if (hotelroomPrice.rowCount === 0) {
      return res.status(404).json({ message: "Hotelroom not found" });
    }

    const { price_per_night, name } = hotelroomPrice.rows[0];

    //Summary price
    const numNigths = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = numNigths * parseFloat(price_per_night);

    //create booking
    const insertBookingSql = `INSERT INTO bookings (user_id, dog_id, hotelroom_id, check_in, check_out, price_per_night, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`;
    const bookingResult = await pool.query(insertBookingSql, [
      userId,
      dog_id,
      hotelroom_id,
      check_in,
      check_out,
      price_per_night,
      "confirmed",
    ]);
    const bookingId = bookingResult.rows[0].id;
    const created_at = new Date(bookingResult.created_at);
    created_at.setHours(0, 0, 0, 0);

    //create invoice
    const insertInvoiceSql = `INSERT INTO invoices (booking_id, total_price) VALUES ($1, $2) RETURNING *`;
    const invoiceResult = await pool.query(insertInvoiceSql, [
      bookingId,
      totalPrice,
    ]);

    //get user name
    const userSql = `SELECT first_name, last_name FROM users WHERE id = $1`;
    const userResult = await pool.query(userSql, [userId]);
    const { first_name, last_name } = userResult.rows[0];
    const fullname = `${first_name} ${last_name}`;

    res.status(200).json({
      message: "Booking and Invoice created Successfully",
      booking_id: bookingId,
      check_in: checkInDate,
      check_out: checkOutDate,
      dog_name: dogName,
      user_name: fullname,
      room_name: name,
      total_price: totalPrice,
      created_at: created_at,
      invoice: invoiceResult.rows[0],
    });
  } catch (error) {
    console.error("Create Booking + Invoice Error:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `SELECT b.id AS booking_id,
        b.check_in,
        b.check_out,
        b.status,
        b.created_at,
        b.price_per_night,
        d.name AS dog_name,
        r.name AS room_name
        FROM bookings b
        JOIN dogs d ON b.dog_id = d.id
        JOIN hotelrooms r ON b.hotelroom_id = r.id
        WHERE b.user_id = $1 
        ORDER BY b.check_in`;

    const response = await pool.query(sql, [userId]);

    res.status(200).json({
      message: "Fetched your bookings successsfully",
      data: response.rows,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

//คงuser_id และ booking_id ไว้เหมือนเดิม แก้ไขแค่ห้อง, checkin, checkout, status
export const updateBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id;
    const { hotelroom_id, check_in, check_out } = req.body;
    if (isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    // check booking duplicate
    const checkBookingSql = `
      SELECT * FROM bookings 
      WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
    `;
    const bookingResult = await pool.query(checkBookingSql, [
      bookingId,
      userId,
    ]);

    if (bookingResult.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Booking not found or cannot be edited" });
    }

    const oldBooking = bookingResult.rows[0];
    const today = new Date();
    const checkIn = new Date(oldBooking.check_in);
    const checkOut = new Date(oldBooking.check_out)
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0,0,0,0)
    const numNigths = Math.ceil((checkOut - checkIn) / (1000 *60*60*24))

    if (today >= checkIn) {
      return res.status(403).json({
        message: "Cannot update booking less than 1 day before check-in",
      });
    }

    // เช็กว่า booking ใหม่ชนกับรายการอื่นหรือไม่
    const checkSql = `
        SELECT * FROM bookings
        WHERE hotelroom_id = $1
        AND check_in <= $3
        AND check_out >= $2
        AND id <> $4 -- ไม่เอาตัวเอง
      `;
    const conflict = await pool.query(checkSql, [
      hotelroom_id,
      check_in,
      check_out,
      bookingId,
    ]);

    if (conflict.rowCount > 0) {
      return res.status(400).json({
        message: "This room is already booked during the selected period.",
      });
    }

    //update price
    const priceSql = `SELECT price_per_night FROM hotelrooms WHERE id = $1`;
    const priceResult = await pool.query(priceSql, [hotelroom_id]);

    if (priceResult.rowCount === 0) {
      return res.status(404).json({ message: "Room Not Found" });
    }

    const price = priceResult.rows[0].price_per_night;

    // อัปเดต booking
    if (!hotelroom_id || !check_in || !check_out) {
      return res
        .status(400)
        .json({ message: "Please provide all booking fields" });
    }

    const updateSql = `
        UPDATE bookings
        SET hotelroom_id = $1,
            check_in = $2,
            check_out = $3,
            price_per_night = $4
        WHERE id = $5
        RETURNING *;
      `;

    const updated = await pool.query(updateSql, [
      hotelroom_id,
      check_in,
      check_out,
      price,
      bookingId,
    ]);

    const updateInvoiceSql = `UPDATE invoices SET total_price = $1 WHERE booking_id = $2`
    await pool.query(updateInvoiceSql, [price * numNigths, bookingId])

    res.status(200).json({
      message: "Booking and Invoive updated successfully",
      data: updated.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

export const cancelBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);

    const sql = `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'confirmed'`;
    const result = await pool.query(sql, [bookingId, userId]);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Booking Not Found or Already Cancelled" });
    }

    const booking = result.rows[0];
    const today = new Date();
    const checkIn = new Date(booking.check_in);
    today.setHours(0, 0, 0, 0);
    checkIn.setHours(0, 0, 0, 0);

    if (today >= checkIn) {
      return res.status(403).json({
        message: "Cannot cancel booking less than 1 day before check-in",
      });
    }

    const cancelSql = `UPDATE bookings SET status = 'cancelled' WHERE id = $1`;
    await pool.query(cancelSql, [bookingId]);

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling booking", error: error.message });
  }
};

export const getAvailableRoomsBySize = async (req, res) => {
  try {
    const { check_in, check_out, size } = req.query;
    const inDate = new Date(check_in);
    const outDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!check_in || !check_out || !size) {
      return res
        .status(400)
        .json({ message: "Missing required query parameters" });
    }

    if (isNaN(inDate) || isNaN(outDate)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (inDate >= outDate) {
      return res
        .status(400)
        .json({ message: "Check-in cannot come after Check-out" });
    }

    if (today > inDate) {
      return res
        .status(400)
        .json({ message: "The selected date already passed" });
    }

    const sql = `
  SELECT r.id, r.name, r.size, r.price_per_night
  FROM hotelrooms r
  WHERE r.size = $1
    AND r.id NOT IN (
      SELECT b.hotelroom_id
      FROM bookings b
      WHERE b.status = 'confirmed'
        AND DATE(b.check_in) <= $3::date
        AND DATE(b.check_out) >= $2::date
    )
  ORDER BY r.name;
`;

    const values = [size, check_in, check_out];
    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      res
        .status(400)
        .json({ message: "No available room for the selected days", data: [] });
    }

    res
      .status(200)
      .json({ message: "Available rooms fetched", data: result.rows });
  } catch (error) {
    console.error("Error fetching available rooms:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
