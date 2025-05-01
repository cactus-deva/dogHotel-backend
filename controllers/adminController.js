import pool from "../db/connect.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//Admin login and issue token
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    //เช็คว่า มี username ในระบบไหม
    const sql = `SELECT * FROM admin WHERE username = $1`;
    const adminResult = await pool.query(sql, [username]);

    if (adminResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const admin = adminResult.rows[0];

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const payload = {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ message: "Admin login successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Login Failed", error: error.message });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    //check dupe
    const checkDuplicateSql = `SELECT * FROM admin WHERE username = $1 OR email = $2`;
    const checkDuplicate = await pool.query(checkDuplicateSql, [
      username,
      email,
    ]);

    if (checkDuplicate.rowCount > 0) {
      res.status(409).json({ message: "Username or email already existed" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const sql = `INSERT INTO admin (username, password, email, role)
    VALUES ($1,$2,$3,$4)
    RETURNING id, username, email, role, created_at`;

    const response = await pool.query(sql, [username, hash, email, "admin"]);
    res.status(200).json({
      message: "Admin registered successfully",
      data: response.rows[0],
    });
  } catch (error) {
    console.error("Register Admin Error:", error.message);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

//เรียกดู user ทั้งหมด filter/search name, phone, email, id จาก query params ได้
export const getAllUsers = async (req, res) => {
  try {
    const { id, name, email, phone } = req.query;
    let sql = `
    SELECT * FROM users
    `;

    let filters = [];
    let values = [];

    if (id) {
      filters.push(`id = $${filters.length + 1}`);
      values.push(parseInt(id));
    }
    if (name) {
      filters.push(
        `LOWER(first_name) LIKE LOWER('%' || $${filters.length + 1} || '%')`
      );
      values.push(name.trim());
    }
    if (email) {
      filters.push(
        `LOWER(email) LIKE LOWER('%' || $${filters.length + 1} || '%')`
      );
      values.push(email.trim());
    }
    if (phone) {
      filters.push(`phone LIKE '%' || $${filters.length + 1} || '%'`);
      values.push(phone.trim());
    }
    if (filters.length > 0) {
      sql += ` WHERE ` + filters.join(" AND ");
    }
    sql += ` ORDER BY created_at DESC`;

    const response = await pool.query(sql, values);
    console.log(response, "res>>>>");
    res
      .status(200)
      .json({ message: "Get Users Successfully", data: response.rows });
  } catch (error) {
    res.status(500).json({ message: "Database Error" });
  }
};

//เรียกดูสุ่นัขทั้งหมดพร้อมเบอร์โทร และ ชื่อเจ้าของ และ search ชื่อหมาผ่าน query params ได้
export const getAllDogs = async (req, res) => {
  try {
    const { name } = req.query;

    let sql = `
      SELECT 
        dogs.id AS dog_id,
        dogs.name AS dog_name,
        dogs.breed,
        dogs.age,
        dogs.weight,
        dogs.health_conditions,
        users.first_name || ' ' || users.last_name AS owner_fullname,
        users.phone
      FROM dogs
      JOIN users ON dogs.user_id = users.id
    `;

    const values = [];

    if (name && name.trim() !== "") {
      sql += ` WHERE LOWER(dogs.name) LIKE LOWER('%' || $1 || '%')`;
      values.push(name.trim());
    }

    const response = await pool.query(sql, values);

    res.status(200).json({
      message: "Get All Dogs Successfully",
      data: response.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Database Error", error: error.message });
  }
};

//เรียกดู bookings ทั้งหมด filter/ search booking_id, user_id, check_in, status ด้วย query params
export const getAllBookings = async (req, res) => {
  try {
    const { booking_id, user_id, status, start_date, end_date } = req.query;
    let sql = `
      SELECT 
        bookings.id AS booking_id,
        dogs.name AS dog_name,
        bookings.user_id AS user_id,
        users.first_name || ' ' || users.last_name AS owner_fullname,
        hotelrooms.name AS room_name,
        TO_CHAR(bookings.check_in,'DD-MM-YYYY') AS check_in,
        TO_CHAR(bookings.check_out,'DD-MM-YYYY') AS check_out,
        bookings.status,
        invoices.total_price AS invoice_total
      FROM bookings
      JOIN dogs ON bookings.dog_id = dogs.id
      JOIN users ON bookings.user_id = users.id
      JOIN hotelrooms ON bookings.hotelroom_id = hotelrooms.id
      LEFT JOIN invoices ON bookings.invoice_id = invoices.id
    `;

    const filters = [];
    const values = [];

    if (booking_id) {
      filters.push(`bookings.id = $${filters.length + 1}`);
      values.push(parseInt(booking_id));
    }
    if (user_id) {
      filters.push(`bookings.user_id = $${filters.length + 1}`);
      values.push(parseInt(user_id));
    }
    if (status) {
      filters.push(`bookings.status = $${filters.length + 1}`);
      values.push(status.trim().toLowerCase());
    }
    if (start_date && end_date) {
      filters.push(
        `bookings.check_in >= $${
          filters.length + 1
        }::date AND bookings.check_in < ($${
          filters.length + 2
        }::date + INTERVAL '1 day')`
      );
      values.push(start_date.trim(), end_date.trim());
    }
    if (start_date && !end_date) {
      filters.push(`bookings.check_in >= $${filters.length + 1}::date`);
      values.push(start_date.trim());
    }

    if (filters.length > 0) {
      sql += " WHERE " + filters.join(" AND ");
    }

    sql += ` ORDER BY bookings.check_in DESC`;

    const response = await pool.query(sql, values);
    res
      .status(200)
      .json({ message: "Get All Booking Successfully", data: response.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Database Error" });
  }
};

//เรียกดู review ทั้งหมด filter/search name, rating, start_date, end_date
export const getAllReviews = async (req, res) => {
  try {
    const { name, rating, start_date, end_date } = req.query;
    let sql = `
      SELECT 
        reviews.id AS review_id,
        users.first_name || ' ' || users.last_name AS reviewer_name,
        reviews.rating,
        reviews.comment,
        TO_CHAR(reviews.created_at, 'DD-MM-YYYY') AS created_at
      FROM reviews
      JOIN users ON reviews.user_id = users.id
    `;

    let filters = [];
    let values = [];

    if (name) {
      filters.push(
        `LOWER(users.first_name) LIKE LOWER ('%' || $${
          filters.length + 1
        } || '%')`
      );
      values.push(name.trim());
    }
    if (rating) {
      filters.push(`reviews.rating = $${filters.length + 1}`);
      values.push(parseInt(rating));
    }
    if (start_date && end_date) {
      filters.push(
        `DATE(reviews.created_at) >= $${
          filters.length + 1
        }::date AND DATE(reviews.created_at) < ($${
          filters.length + 2
        }::date + INTERVAL '1 day')`
      );
      values.push(start_date.trim(), end_date.trim());
    }

    if (filters.length > 0) {
      sql += " WHERE " + filters.join(" AND ");
    }

    sql += " ORDER BY reviews.created_at DESC";

    const response = await pool.query(sql, values);

    res
      .status(200)
      .json({ message: "Get all reviews successfully", data: response.rows });
  } catch (error) {
    res.status(500).json({ message: "Database error", error: error.message });
  }
};

//เช็็คห้องว่าง ใส่เป็น query params แทนเพื่อเช็คห้องว่่าง
export const getAvailableRooms = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res
        .status(400)
        .json({ message: "Please provide check_in and check_out dates" });
    }

    const sql = `
      SELECT * FROM hotelrooms
      WHERE is_active = true
      AND id NOT IN (
        SELECT hotelroom_id FROM bookings
        WHERE check_in <= $2 AND check_out >= $1
      )
    `;
    const response = await pool.query(sql, [check_in, check_out]);

    res.status(200).json({
      message: "Fetched available rooms successfully",
      data: response.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch available rooms",
      error: error.message,
    });
  }
};

//เปลี่ยน room status : close / open
export const toggleRoomStatus = async (req, res) => {
  const { id, is_active } = req.body;
  try {
    const sql = `UPDATE hotelrooms SET is_active = $1 WHERE id = $2`;
    const response = await pool.query(sql, [is_active, id]);
    if (response.rowCount > 0) {
      res.status(200).json({
        message: `Updated Room Status, Room Status is now ${
          is_active ? "opened" : "closed"
        }`,
      });
    } else {
      return res
        .status(404)
        .json({ message: "Failed to Update Room Status", data: message.error });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
