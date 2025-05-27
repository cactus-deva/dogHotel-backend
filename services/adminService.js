import pool from "../db/connect.js";
import bcrypt from "bcrypt";

export const checkAdminUsername = async (username) => {
  //เช็คว่า มี username ในระบบไหม
  const sql = `SELECT * FROM admin WHERE username = $1`;
  const response = await pool.query(sql, [username]);
  return response;
};

export const createAdminUsername = async ({ username, password, email }) => {
  //check dupe
  const checkDuplicateSql = `SELECT * FROM admin WHERE username = $1 OR email = $2`;
  const checkDuplicate = await pool.query(checkDuplicateSql, [username, email]);

  if (checkDuplicate.rowCount > 0) {
    const error = new Error("Username or email already existed");
    error.status = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const sql = `INSERT INTO admin (username, password, email, role)
    VALUES ($1,$2,$3,$4)
    RETURNING id, username, email, role, created_at`;

  const response = await pool.query(sql, [username, hash, email, "admin"]);
  return response.rows[0];
};

export const getUsers = async ({ id, name, email, phone }) => {
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
    filters.push(`LOWER(first_name) LIKE $${filters.length + 1}`);
    values.push(`%${name.trim().toLowerCase()}%`);
  }
  if (email) {
    filters.push(`LOWER(email) LIKE $${filters.length + 1}`);
    values.push(`%${email.trim().toLowerCase()}%`);
  }

  if (phone) {
    filters.push(`phone LIKE $${filters.length + 1}`);
    values.push(`%${phone.trim()}%`);
  }

  if (filters.length > 0) {
    sql += ` WHERE ` + filters.join(" AND ");
  }
  sql += ` ORDER BY created_at DESC`;

  const response = await pool.query(sql, values);
  return response.rows;
};

export const deleteUserByUserId = async (userId) => {
  //check userId valid
  const checkUserIdSql = `SELECT * FROM users WHERE id = $1`;
  const checkUser = await pool.query(checkUserIdSql, [userId]);

  if (checkUser.rowCount === 0) {
    const error = new Error("Invalid user ID");
    error.status = 404;
    throw error;
  }
  const sql = `DELETE FROM users where id = $1`;
  await pool.query(sql, [userId]);
};

export const getDogs = async ({ name }) => {
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
  return response.rows;
};

export const getBookings = async ({
  booking_id,
  user_id,
  status,
  start_date,
  end_date,
}) => {
  let sql = `
      SELECT 
        bookings.id AS booking_id,
        dogs.name AS dog_name,
        bookings.user_id AS user_id,
        users.first_name || ' ' || users.last_name AS owner_fullname,
        hotelrooms.name AS room_name,
        bookings.check_in AS check_in,
        bookings.check_out AS check_out,
        bookings.status,
        invoices.total_price AS invoice_total
      FROM bookings
      JOIN dogs ON bookings.dog_id = dogs.id
      JOIN users ON bookings.user_id = users.id
      JOIN hotelrooms ON bookings.hotelroom_id = hotelrooms.id
      LEFT JOIN invoices ON bookings.id = invoices.booking_id
    `;

  const filters = [];
  const values = [];

  if (booking_id) {
    filters.push(`bookings.id = $${values.length + 1}`);
    values.push(parseInt(booking_id));
    console.log("booking_id filter:", booking_id);
  }
  console.log(sql, "sql");
  console.log(values, "values");
  if (user_id) {
    filters.push(`bookings.user_id = $${values.length + 1}`);
    values.push(parseInt(user_id));
  }
  if (status) {
    filters.push(`bookings.status = $${values.length + 1}`);
    values.push(status.trim().toLowerCase());
  }
  if (start_date && end_date) {
    filters.push(
      `bookings.check_in >= $${
        values.length + 1
      }::date AND bookings.check_in < ($${
        values.length + 2
      }::date + INTERVAL '1 day')`
    );
    values.push(start_date.trim(), end_date.trim());
  }
  if (start_date && !end_date) {
    filters.push(`bookings.check_in >= $${values.length + 1}::date`);
    values.push(start_date.trim());
  }

  if (filters.length > 0) {
    sql += " WHERE " + filters.join(" AND ");
  }

  sql += ` ORDER BY bookings.check_in DESC`;

  const response = await pool.query(sql, values);
  console.log(sql, "sql<<<");
  console.log(values, "values");
  return response.rows;
};

export const getReviews = async ({ name, rating, start_date, end_date }) => {
  let sql = `
      SELECT 
        reviews.id AS review_id,
        users.first_name || ' ' || users.last_name AS reviewer_name,
        reviews.rating,
        reviews.comment,
        reviews.created_at AS created_at
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
  return response.rows;
};

export const getRooms = async ({ check_in, check_out }) => {
  const sql = `
      SELECT * FROM hotelrooms
      WHERE is_active = true
      AND id NOT IN (
        SELECT hotelroom_id FROM bookings
        WHERE check_in <= $2 AND check_out >= $1
      )
    `;
  const response = await pool.query(sql, [check_in, check_out]);
  return response.rows;
};

export const changeRoomStatus = async ({ id, is_active }) => {
  const sql = `UPDATE hotelrooms SET is_active = $1 WHERE id = $2 RETURNING *`;
  const response = await pool.query(sql, [is_active, id]);
  if (response.rowCount === 0) {
    const error = new Error(
      "The selected room already has same status or invalid room ID"
    );
    error.status = 400;
    throw error;
  }
  return response.rows[0];
};
