import pool from "../db/connect.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const username = req.body.username.toLowerCase();
    const { first_name, last_name, password, email, phone } = req.body;

    const hashPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO users (first_name, last_name, username, password, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const response = await pool.query(sql, [
      first_name,
      last_name,
      username,
      hashPassword,
      email,
      phone,
    ]);

    res.status(201).json({
      message: "Register Successfully",
      data: response.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      // unique_violation
      res.status(409).json({
        message: "Username or email already exists",
      });
    } else {
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const usernameStr = username.toLowerCase()
    const sql = `SELECT * FROM users WHERE username = $1`;
    const response = await pool.query(sql, [usernameStr]);

    if (response.rowCount === 0) {
      return res.status(400).json({ message: "Username Not Found" });
    }

    const user = response.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    const token = jwt.sign(
      { id: user.id,username: user.username},
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login Successful",
      userId: user.id,
      name: user.first_name,
      token
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.user.id;

    const sql = `SELECT username, first_name, last_name, email, phone, points, created_at FROM users WHERE id = $1`;
    const response = await pool.query(sql, [userId]);
    if (response.rowCount > 0) {
      res
        .status(200)
        .json({ message: "Get data successfully", data: response.rows[0] });
    } else {
      return res.status(404).json({ message: "User ID invalid" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

//ไม่ให้ user แก้ไข username & email
export const updateUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { first_name, last_name, password, phone } = req.body;
    let sql, values;
    if(password) {
       const hashPassword = await bcrypt.hash(password, 10);
       sql = `UPDATE users SET first_name = $1, last_name = $2, password = $3, phone = $4 WHERE id = $5 RETURNING *`
       values = [first_name, last_name, hashPassword, phone, id]
    } else {
      sql = `UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4 RETURNING *`;
      values = [first_name, last_name, phone, id];
    }
    
    const response = await pool.query(sql, values);
    if (response.rowCount > 0) {
      res
        .status(200)
        .json({ message: "Update Data Successfully", data: response.rows[0] });
    } else {
      res.status(404).json({ message: "Update Data Failed" });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

