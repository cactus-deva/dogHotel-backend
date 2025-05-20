import pool from "../db/connect.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import {
  changeRoomStatus,
  checkAdminUsername,
  createAdminUsername,
  deleteUserByUserId,
  getBookings,
  getDogs,
  getReviews,
  getRooms,
  getUsers,
} from "../services/adminService.js";

//Admin login and issue token
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const adminUsername = await checkAdminUsername({ username });

    if (!adminUsername || adminUsername.rowCount === 0) {
      const error = new Error("Invalid username or password");
      error.status = 400;
      throw error;
    }

    const admin = adminUsername;

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      const error = new Error("Invalid username or password");
      error.status = 400;
      throw error;
    }

    const payload = {
      id: admin.id,
      username: admin.username,
      role: admin.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.status(200).json({ message: "Admin login successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Login Failed", error: error.message });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({
        message: "Please input all required fields",
      });
    }
    const newAdmin = await createAdminUsername({ username, email, password });

    res.status(200).json({
      message: "Admin registered successfully",
      data: newAdmin,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create Admin", error: error.message });
  }
};

//เรียกดู user ทั้งหมด filter/search name, phone, email, id จาก query params ได้
export const getAllUsers = async (req, res) => {
  try {
    const { id, name, email, phone } = req.query;
    const allUsers = await getUsers({ id, name, email, phone });
    console.log(allUsers, "allusers");
    res.status(200).json({ message: "Get Users Successfully", data: allUsers });
  } catch (error) {
    res.status(500).json({ message: "Database Error" });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(404).json({ message: "Invalid user ID type" });
    }

    await deleteUserByUserId(userId);

    res.status(200).json({ message: "Delete Successfully" });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

//เรียกดูสุ่นัขทั้งหมดพร้อมเบอร์โทร และ ชื่อเจ้าของ และ search ชื่อหมาผ่าน query params ได้
export const getAllDogs = async (req, res) => {
  try {
    const { name } = req.query;
    const allDogs = await getDogs({ name });

    res.status(200).json({
      message: "Get All Dogs Successfully",
      data: allDogs,
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

//เรียกดู bookings ทั้งหมด filter/ search booking_id, user_id, check_in, status ด้วย query params
export const getAllBookings = async (req, res) => {
  try {
    const { booking_id, user_id, status, start_date, end_date } = req.query;
    console.log("req.query", req.query);
    const allBookings = await getBookings({
      booking_id,
      user_id,
      status,
      start_date,
      end_date,
    });

    res
      .status(200)
      .json({ message: "Get All Booking Successfully", data: allBookings });
  } catch (error) {
    res.status(500).json({ message: "Failed to get bookings from Database" });
  }
};

//เรียกดู review ทั้งหมด filter/search name, rating, start_date, end_date
export const getAllReviews = async (req, res) => {
  try {
    const { name, rating, start_date, end_date } = req.query;
    const allReviews = await getReviews({ name, rating, start_date, end_date });

    res
      .status(200)
      .json({ message: "Get all reviews successfully", data: allReviews });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to get reviews from database",
        error: error.message,
      });
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

    const allAvailableRooms = await getRooms({ check_in, check_out });

    res.status(200).json({
      message: "Fetched available rooms successfully",
      data: allAvailableRooms,
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
    const roomStatus = await changeRoomStatus({ id, is_active });
    if (roomStatus) {
      res.status(200).json({
        message: `Updated Room Status, Room Status is now ${
          is_active ? "opened" : "closed"
        }`,
      });
    } else {
      res.status(400).json({
        message: "failed to update room status" })
    }
  } catch (error) {
    res.status(500).json({ message: "Database Error" });
  }
};
