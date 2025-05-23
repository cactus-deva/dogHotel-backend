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
export const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const usernameStr = username.toLowerCase().trim();
    if (!username || !password) {
      const error = new Error("Please enter username and password");
      error.status = 400;
      throw error;
    }

    const adminResult = await checkAdminUsername(usernameStr);

    if (adminResult.rowCount === 0) {
      const error = new Error("Invalid username");
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
    const { username, password, email } = req.body;
    const usernameStr = username.toLowerCase().trim();

    if (!usernameStr || !password || !email) {
      const error = new Error("Please fill all required fields");
      error.status = 400;
      throw error;
    }
    const newAdmin = await createAdminUsername(usernameStr, {
      password,
      email,
    });

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
    const { id, name, email, phone } = req.query;
    const allUsers = await getUsers({ id, name, email, phone });

    res.status(200).json({ message: "Get Users Successfully", data: allUsers });
  } catch (error) {
    next(error);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      const error = new Error("Invalid User ID type");
      error.status = 400;
      throw error;
    }

    await deleteUserByUserId(userId);

    res.status(200).json({ message: "Delete Successfully" });
  } catch (error) {
    next(error);
  }
};

//เรียกดูสุ่นัขทั้งหมดพร้อมเบอร์โทร และ ชื่อเจ้าของ และ search ชื่อหมาผ่าน query params ได้
export const getAllDogs = async (req, res, next) => {
  try {
    const { name } = req.query;
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
    const { booking_id, user_id, status, start_date, end_date } = req.query;

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
    const { name, rating, start_date, end_date } = req.query;
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
    next(error);
  }
};

//เปลี่ยน room status : close / open
export const toggleRoomStatus = async (req, res, next) => {
  const { id, is_active } = req.body;
  try {
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
