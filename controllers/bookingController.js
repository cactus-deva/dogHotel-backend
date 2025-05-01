import pool from "../db/connect.js";

export const createBooking = async (req, res) => {
  try {
    const { dog_id, hotelroom_id, check_in, check_out, status } = req.body;

    if (!dog_id || !hotelroom_id || !check_in || !check_out || !status) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const userId = req.user.id;
    const checkDogSql = `SELECT * FROM dogs WHERE id = $1 AND user_id = $2`;
    const checkDog = await pool.query(checkDogSql, [dog_id, userId]);

    if(checkDog.rowCount === 0) {
        return res.status(403).json({message: "You do not own this dog"})
    }

    // เช็กว่าห้องนี้เคยถูกจองไปรึยัง
    const checkRoomOverlapSql = `
        SELECT * FROM bookings
        WHERE hotelroom_id = $1
        AND check_in <= $3
        AND check_out >= $2
      `;
    const checkRoomOverlap = await pool.query(checkRoomOverlapSql, [
      hotelroom_id,
      check_in,
      check_out,
    ]);

    if (checkRoomOverlap.rowCount > 0) {
      return res.status(400).json({
        message: "This room is already booked on the selected date.",
      });
    }
    
    //เช็คว่าหมาตัวนี้เคยจองไปแล้วรึยัง
    const checkDogOverlapSql = `
      SELECT * FROM bookings
      WHERE dog_id = $1
        AND check_in <= $3
        AND check_out >= $2
    `;
    const checkDogOverlap = await pool.query(checkDogOverlapSql, [dog_id, check_in, check_out]);

    if (checkDogOverlap.rowCount > 0) {
      return res.status(409).json({ message: "This dog already has a booking during the selected dates" });
    }

    // ถ้าไม่ซ้ำ insert ได้
    const insertSql = `
        INSERT INTO bookings (user_id, dog_id, hotelroom_id, check_in, check_out, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
    const insertResponse = await pool.query(insertSql, [
      userId,
      dog_id,
      hotelroom_id,
      check_in,
      check_out,
      status || "pending"
    ]);

    const booking = insertResponse.rows[0];

    // ดึงชื่อ user + ชื่อหมา มาแสดง
    const infoSql = `
        SELECT 
          users.first_name || ' ' || users.last_name AS owner_name,
          dogs.name AS dog_name
        FROM users
        JOIN dogs ON dogs.id = $1
        WHERE users.id = $2;
      `;
    const response = await pool.query(infoSql, [dog_id, userId]);

    const result = {
      ...booking,
      owner_name: response.rows[0]?.owner_name,
      dog_name: response.rows[0]?.dog_name,
    };

    res.status(201).json({
      message: "Booking created successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Booking creation failed",
      error: error.message,
    });
  }
};


export const getMyBookings = async (req,res) => {
    try {
        const userId = req.user.id
        const sql = `SELECT b.id AS booking_id,
        b.check_in,
        b.check_out,
        b.status,
        b.created_at,
        d.name AS dog_name,
        r.name AS room_name
        FROM bookings b
        JOIN dogs d ON b.dog_id = d.id
        JOIN hotelrooms r ON b.hotelroom_id = r.id
        WHERE b.user_id = $1 
        ORDER BY b.created_at DESC`

        const response = await pool.query(sql,[userId])

        res.status(200).json({
            message: "Fetched your bookings successsfully", data: response.rows
        })
    } catch (error) {
        res.status(500).json({message: "Failed to fetch bookings", error: error.message})
    }
}

//คงuser_id และ booking_id ไว้เหมือนเดิม แก้ไขแค่ห้อง, checkin, checkout, status
//ไว้แก้ไข status ถ้าupdate default เป็น reschedule
export const updateBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id
    if(isNaN(bookingId)) {
        return res.status(400).json({message: "Invalid Booking ID format"})
    }

    const { hotelroom_id, check_in, check_out, status } = req.body;

    // ดึง booking เดิมมาก่อน
    const oldBooking = await pool.query(
      "SELECT * FROM bookings WHERE id = $1",
      [bookingId]
    );

    if (oldBooking.rowCount === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const current = oldBooking.rows[0];

    if(current.user_id !== userId) {
        return res.status(403).json({message: "You are not allowed to update this booking"})
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

    // อัปเดต booking
    if(!hotelroom_id || !check_in || !check_out || !status) {
        return res.status(400).json({message: "Please provide all booking fields"})
    }

    const updateSql = `
        UPDATE bookings
        SET hotelroom_id = $1,
            check_in = $2,
            check_out = $3,
            status = $4
        WHERE id = $5
        RETURNING *;
      `;

    const updated = await pool.query(updateSql, [
      hotelroom_id,
      check_in,
      check_out,
      status || current.status,
      bookingId,
    ]);

    res.status(200).json({
      message: "Booking updated successfully",
      data: updated.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update booking",
      error: error.message,
    });
  }
};

export const deleteBookingById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid booking ID format" });
    }

    const userId = req.user.id

    const checkSql = `SELECT * FROM bookings WHERE id = $1`
    const booking = await pool.query(checkSql, [id])

    if(booking.rowCount === 0) {
        return res.status(404).json({message: "Booking not found"})
    }

    if(booking.rows[0].user_id !== userId) {
        return res.status(403).json({message: "You are not allowed to delete this booking"})
    }

    const deleteSql = `DELETE FROM bookings WHERE id = $1`;
    const response = await pool.query(deleteSql, [id]);

    res.status(200).json({ message: "Delete Successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete booking",
      error: error.message,
    });
  }
};
