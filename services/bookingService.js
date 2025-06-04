import pool from "../db/connect.js";

export const createNewBookingAndInvoice = async ({
  userId,
  dog_id,
  hotelroom_id,
  check_in,
  check_out,
}) => {
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  checkInDate.setHours(0, 0, 0, 0);
  checkOutDate.setHours(0, 0, 0, 0);

  //check dog belongs to user
  const checkDogSql = `SELECT name FROM dogs WHERE id = $1 AND user_id = $2`;
  const dogResult = await pool.query(checkDogSql, [dog_id, userId]);
  if (dogResult.rowCount === 0) {
    const error = new Error("You do not own this dog");
    error.status = 403;
    throw error;
  }

  const dogName = dogResult.rows[0].name;

  //check room has duplicate booking
  const checkRoomSql = `SELECT * from bookings WHERE hotelroom_id = $1 AND check_in = $2 AND check_out = $3 AND status = 'confirmed'`;
  const checkRoom = await pool.query(checkRoomSql, [
    hotelroom_id,
    check_in,
    check_out,
  ]);

  if (checkRoom.rowCount > 0) {
    const error = new Error("Room already booked for this period");
    error.status = 409;
    throw error;
  }

  //check dog has duplicate booking
  const checkDogBookingSql = `SELECT * from bookings WHERE dog_id = $1 AND status = 'confirmed' AND check_in <= $3 AND check_out >= $2`;
  const checkDogBooking = await pool.query(checkDogBookingSql, [
    dog_id,
    check_in,
    check_out,
  ]);

  if (checkDogBooking.rowCount > 0) {
    const error = new Error(
      "This dog already has a booking during this period"
    );
    error.status = 409;
    throw error;
  }

  //get hotelroom price
  const hotelroomPriceSql = `SELECT price_per_night, name FROM hotelrooms WHERE id = $1`;
  const hotelroomPrice = await pool.query(hotelroomPriceSql, [hotelroom_id]);
  if (hotelroomPrice.rowCount === 0) {
    const error = new Error("Hotelroom not found");
    error.status = 404;
    throw error;
  }

  const { price_per_night, name, size } = hotelroomPrice.rows[0];

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

  return {
    booking_id: bookingId,
    check_in: checkInDate,
    check_out: checkOutDate,
    dog_name: dogName,
    user_name: fullname,
    room_name: name,
    total_price: totalPrice,
    hotelroom_id: hotelroom_id,
    size: size,
    created_at: created_at,
    invoice: invoiceResult.rows[0],
  };
};

export const getBookingByUserId = async (userId) => {
  const sql = `SELECT b.id AS booking_id,
        b.check_in,
        b.check_out,
        b.dog_id,
        b.hotelroom_id,
        b.status,
        b.created_at,
        b.price_per_night,
        d.name AS dog_name,
        r.name AS room_name,
        r.size AS size
        FROM bookings b
        JOIN dogs d ON b.dog_id = d.id
        JOIN hotelrooms r ON b.hotelroom_id = r.id
        WHERE b.user_id = $1 
        ORDER BY b.check_in`;

  const response = await pool.query(sql, [userId]);
  return response.rows;
};

export const updateBookingByBookingId = async ({
  userId,
  bookingId,
  hotelroom_id,
  check_in,
  check_out,
  dog_id,
}) => {
  // check booking duplicate
  const checkBookingSql = `
      SELECT * FROM bookings 
      WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
    `;
  const bookingResult = await pool.query(checkBookingSql, [bookingId, userId]);

  if (bookingResult.rowCount === 0) {
    const error = new Error("Booking not found or cannot be edited");
    error.status = 404;
    throw error;
  }

  const oldBooking = bookingResult.rows[0];
  const today = new Date();
  const newCheckIn = new Date(check_in);
  const newCheckOut = new Date(check_out);
  today.setHours(0, 0, 0, 0);
  newCheckIn.setHours(0, 0, 0, 0);
  newCheckOut.setHours(0, 0, 0, 0);

  const numNigths = Math.ceil(
    (newCheckIn - newCheckOut) / (1000 * 60 * 60 * 24)
  );

  if (today > newCheckIn) {
    const error = new Error("Check-in date cannot be in the past");
    error.status = 400;
    throw error;
  }

  if (newCheckIn >= newCheckOut) {
    const error = new Error("Check-in date cannot come before Check-out date");
    error.status = 400;
    throw error;
  }
  // เช็คหมาจองซ้ำช่วงวันนั้นไหม
  const checkDogBookingSql = `
  SELECT * from bookings 
  WHERE dog_id = $1 
    AND status = 'confirmed'
    AND check_in <= $3 
    AND check_out >= $2
    AND id <> $4
`;

  const checkDogBooking = await pool.query(checkDogBookingSql, [
    dog_id,
    check_in,
    check_out,
    bookingId,
  ]);

  if (checkDogBooking.rowCount > 0) {
    const error = new Error(
      "This dog already has a booking during this period"
    );
    error.status = 409;
    throw error;
  }

  // เช็กว่า booking ใหม่ชนกับรายการอื่นหรือไม่
  const checkSql = `
        SELECT * FROM bookings
        WHERE hotelroom_id = $1
        AND check_in <= $3
        AND check_out >= $2
        AND id <> $4 
        AND status = 'confirmed'
      `;
  const conflict = await pool.query(checkSql, [
    hotelroom_id,
    check_in,
    check_out,
    bookingId,
  ]);

  if (conflict.rowCount > 0) {
    const error = new Error(
      "This room is already booked during the selected period."
    );
    error.status = 400;
    throw error;
  }

  //update price
  const priceSql = `SELECT price_per_night FROM hotelrooms WHERE id = $1`;
  const priceResult = await pool.query(priceSql, [hotelroom_id]);

  if (priceResult.rowCount === 0) {
    const error = new Error("Room not found");
    error.status = 404;
    throw error;
  }

  const price = priceResult.rows[0].price_per_night;

  // อัปเดต booking
  if (!hotelroom_id || !check_in || !check_out) {
    const error = new Error("Please provide all booking fields");
    error.status = 400;
    throw error;
  }

  const updateSql = `
        UPDATE bookings
        SET hotelroom_id = $1,
            check_in = $2,
            check_out = $3,
            price_per_night = $4,
            dog_id = $5
        WHERE id = $6
        RETURNING *;
      `;

  const response = await pool.query(updateSql, [
    hotelroom_id,
    check_in,
    check_out,
    price,
    dog_id,
    bookingId,
  ]);

  const updateInvoiceSql = `UPDATE invoices SET total_price = $1 WHERE booking_id = $2`;
  await pool.query(updateInvoiceSql, [price * numNigths, bookingId]);

  const updateBooking = response.rows[0];
  const roomRes = await pool.query(
    `SELECT name FROM hotelrooms WHERE id = $1`,
    [updateBooking.hotelroom_id]
  );
  const room_name = roomRes.rows[0]?.name || "unknown";

  return {
    ...updateBooking,
    room_name,
  };
};

export const cancelBookingByBookingId = async (userId, bookingId) => {
  const sql = `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'confirmed'`;
  const result = await pool.query(sql, [bookingId, userId]);

  if (result.rowCount === 0) {
    const error = new Error("Booking Not Found or Already Cancelled");
    error.status = 404;
    throw error;
  }

  const booking = result.rows[0];
  const today = new Date();
  const checkIn = new Date(booking.check_in);
  today.setHours(0, 0, 0, 0);
  checkIn.setHours(0, 0, 0, 0);

  if (today >= checkIn) {
    const error = new Error(
      "Cannot cancel booking less than 1 day before check-in"
    );
    error.status = 403;
    throw error;
  }

  const cancelSql = `UPDATE bookings SET status = 'cancelled' WHERE id = $1`;
  await pool.query(cancelSql, [bookingId]);
};

export const getAvailableRoomByRoomSize = async ({
  check_in,
  check_out,
  size,
}) => {
  const sql = `
  SELECT r.id, r.name, r.size, r.price_per_night
  FROM hotelrooms r
  WHERE r.size = $1
  AND r.is_active = true
    AND r.id NOT IN (
      SELECT b.hotelroom_id
      FROM bookings b
      WHERE b.status = 'confirmed'
        AND DATE(b.check_in) <= $3
        AND DATE(b.check_out) >= $2
    )
  ORDER BY r.name;
`;

  const values = [size, check_in, check_out];
  const result = await pool.query(sql, values);

  if (result.rowCount === 0) {
    const error = new Error("No available room for the selected days");
    error.status = 400;
    throw error;
  }

  return result.rows;
};
