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
import { sanitizeNumber, sanitizeString } from "../utils/sanitizeHelper.js";

//Admin login and issue token
export const adminLogin = async (req, res, next) => {
  try {
    const password = sanitizeString(req.body.password);
    const username = sanitizeString(req.body.username.toLowerCase().trim());
    if (!username || !password) {
      const error = new Error("Please enter username and password");
      error.status = 400;
      throw error;
    }

    const adminResult = await checkAdminUsername(username);

    if (adminResult.rowCount === 0) {
      const error = new Error("Invalid username or password");
      error.status = 400;
      throw error;
    }

    const admin = adminResult.rows[0];
    const isMatch = await bcrypt.compare(password.trim(), admin.password);

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
    next(error);
  }
};

export const registerAdmin = async (req, res, next) => {
  try {
    const password = sanitizeString(req.body.password);
    const username = sanitizeString(req.body.username.toLowerCase().trim());
    const email = sanitizeString(req.body.email);

    if (!username || !password || !email) {
      const error = new Error("Please fill all required fields");
      error.status = 400;
      throw error;
    }
    const newAdmin = await createAdminUsername({ username, password, email });

    res.status(200).json({
      message: "Admin registered successfully",
      data: newAdmin,
    });
  } catch (error) {
    next(error);
  }
};

//เรียกดู user ทั้งหมด filter/search name, phone, email, id จาก query params ได้
export const getAllUsers = async (req, res, next) => {
  try {
    const id = req.query.id ? sanitizeNumber(req.query.id) : undefined;
    const name = req.query.name ? sanitizeString(req.query.name) : undefined;
    const email = req.query.email ? sanitizeString(req.query.email) : undefined;
    const phone = req.query.phone ? sanitizeString(req.query.phone) : undefined;
    const allUsers = await getUsers({ id, name, email, phone });

    res.status(200).json({ message: "Get Users Successfully", data: allUsers });
  } catch (error) {
    next(error);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const userId = sanitizeNumber(req.params.userId);

    await deleteUserByUserId(userId);

    res.status(200).json({ message: "Delete Successfully" });
  } catch (error) {
    next(error);
  }
};

//เรียกดูสุ่นัขทั้งหมดพร้อมเบอร์โทร และ ชื่อเจ้าของ และ search ชื่อหมาผ่าน query params ได้
export const getAllDogs = async (req, res, next) => {
  try {
    const name = req.query.name ? sanitizeString(req.query.name) : undefined;
    const allDogs = await getDogs({ name });

    res.status(200).json({
      message: "Get All Dogs Successfully",
      data: allDogs,
    });
  } catch (error) {
    next(error);
  }
};

//เรียกดู bookings ทั้งหมด filter/ search booking_id, user_id, check_in, status ด้วย query params
export const getAllBookings = async (req, res, next) => {
  try {
    const booking_id = req.query.booking_id
      ? sanitizeNumber(req.query.booking_id)
      : undefined;
    const user_id = req.query.user_id
      ? sanitizeNumber(req.query.user_id)
      : undefined;
    const status = req.query.status
      ? sanitizeString(req.query.status)
      : undefined;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

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
    next(error);
  }
};

//เรียกดู review ทั้งหมด filter/search name, rating, start_date, end_date
export const getAllReviews = async (req, res, next) => {
  try {
    const name = req.query.name ? sanitizeString(req.query.name) : undefined;
    const rating = req.query.rating
      ? sanitizeNumber(req.query.rating)
      : undefined;
    const start_date = req.query.start_date;
    const end_date = req.query.end_date;

    const allReviews = await getReviews({ name, rating, start_date, end_date });

    res
      .status(200)
      .json({ message: "Get all reviews successfully", data: allReviews });
  } catch (error) {
    next(error);
  }
};

//เช็็คห้องว่าง ใส่เป็น query params เพื่อเช็คห้องว่่าง
export const getAvailableRooms = async (req, res, next) => {
  try {
    const check_in = req.query.check_in;
    const check_out = req.query.check_out;

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
    next(error);
  }
};

//เปลี่ยน room status : close / open
export const toggleRoomStatus = async (req, res, next) => {
  try {
    const id = sanitizeNumber(req.body.id);
    const is_active = req.body.is_active;

    if (typeof is_active !== "boolean") {
      const error = new Error("Room status must be true or false");
      error.status = 400;
      throw error;
    }

    const roomStatus = await changeRoomStatus({ id, is_active });
    if (!roomStatus) {
      const error = new Error("Failed to update room status");
      error.status = 400;
      throw error;
    }
    res.status(200).json({
      message: `Updated Room Status, Room Status is now ${
        is_active ? "opened" : "closed"
      }`,
    });
  } catch (error) {
    next(error);
  }
};
