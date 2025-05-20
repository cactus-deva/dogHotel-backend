import bcrypt from "bcrypt";
import pool from "../db/connect.js";

export const createUser = async ({
  first_name,
  last_name,
  username,
  password,
  email,
  phone,
}) => {
  const hashPassword = await bcrypt.hash(password, 10);
  const sql = `
      INSERT INTO users (first_name, last_name, username, password, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
  const values = [first_name, last_name, username, hashPassword, email, phone];
  const response = await pool.query(sql, values);
  return response.rows[0];
};

export const findUserByUsername = async (username) => {
  const sql = `SELECT * FROM users WHERE username = $1`;
  const response = await pool.query(sql, [username]);
  return response.rows[0];
};

export const findUserByUserId = async (userId) => {
  const sql = `SELECT username, first_name, last_name, email, phone, points, created_at FROM users WHERE id = $1`;
  const response = await pool.query(sql, [userId]);
  return response.rows[0];
};

export const updateUserDataById = async (id, {first_name, last_name, password, phone}) => {
    let sql, values

    if(password) {
           const hashPassword = await bcrypt.hash(password, 10);
           sql = `UPDATE users SET first_name = $1, last_name = $2, password = $3, phone = $4 WHERE id = $5 RETURNING id, first_name, last_name, phone`
           values = [first_name, last_name, hashPassword, phone, id]
        } else {
          sql = `UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4 RETURNING *`;
          values = [first_name, last_name, phone, id];
        }
           const response = await pool.query(sql, values);
           return response.rows[0]
}