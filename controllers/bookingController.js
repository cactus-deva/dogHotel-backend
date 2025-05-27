import {
  cancelBookingByBookingId,
  createNewBookingAndInvoice,
  getAvailableRoomByRoomSize,
  getBookingByUserId,
  updateBookingByBookingId,
} from "../services/bookingService.js";
import {
  sanitizeNumber,
  sanitizeString,
  validateDate,
} from "../utils/sanitizeHelper.js";

export const createBookingAndInvoice = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dog_id = sanitizeNumber(req.body.dog_id);
    const hotelroom_id = sanitizeNumber(req.body.hotelroom_id);
    const check_in = validateDate(req.body.check_in, "Check-in Date");
    const check_out = validateDate(req.body.check_out, "Check-out Date");
    const today = new Date();

    //check date
    today.setHours(0, 0, 0, 0);
    check_in.setHours(0, 0, 0, 0);
    check_out.setHours(0, 0, 0, 0);

    if (!check_in || !check_out) {
      const error = new Error("Please select check-in and check-out date");
      error.status = 400;
      throw error;
    }
    if (today > check_in) {
      const error = new Error("Selected date already passed");
      error.status = 400;
      throw error;
    }

    if (check_in >= check_out) {
      const error = new Error("Invalid check-in / check-out date");
      error.status = 400;
      throw error;
    }

    if (!dog_id || !hotelroom_id || !check_in || !check_out) {
      const error = new Error("Please fill all fields before book");
      error.status = 400;
      throw error;
    }

    const newBookingAndInvoice = await createNewBookingAndInvoice({
      userId,
      dog_id,
      hotelroom_id,
      check_in,
      check_out,
    });

    const {
      booking_id,
      check_in: checkIn,
      check_out: checkOut,
      dog_name,
      user_name,
      room_name,
      total_price,
      invoice,
    } = newBookingAndInvoice;

    const transformedBooking = {
      booking_id,
      check_in: checkIn,
      check_out: checkOut,
      dog_name,
      user_name,
      room_name,
      price_per_night: total_price,
      hotelroom_id,
      dog_id,
      status: "confirmed",
      invoice,
    };

    res.status(200).json({
      message: "Booking and Invoice created Successfully",
      data: transformedBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      const error = new Error("Invalid User ID");
      error.status = 400;
      throw error;
    }

    const myBookings = await getBookingByUserId(userId);

    res.status(200).json({
      message: "Fetched your bookings successsfully",
      data: myBookings,
    });
  } catch (error) {
    next(error);
  }
};

//คงuser_id และ booking_id ไว้เหมือนเดิม แก้ไขแค่ห้อง, checkin, checkout
export const updateBookingById = async (req, res, next) => {
  try {
    const bookingId = sanitizeNumber(req.params.bookingId);
    const userId = req.user.id;
    const hotelroom_id = sanitizeNumber(req.body.hotelroom_id);
    const check_in = validateDate(req.body.check_in, "Check-in Date");
    const check_out = validateDate(req.body.check_out, "Check-out Date");
    const dog_id = sanitizeNumber(req.body.dog_id);

    if (!hotelroom_id || !check_in || !check_out || !dog_id) {
      const error = new Error("Please fill all fields before update booking");
      error.status = 400;
      throw error;
    }

    const updatedBooking = await updateBookingByBookingId({
      userId,
      bookingId,
      hotelroom_id,
      check_in,
      check_out,
      dog_id,
    });

    const transformedBooking = {
      ...updatedBooking,
      booking_id: updatedBooking.id,
    };
    delete transformedBooking.id;

    res.status(200).json({
      message: "Booking and Invoive updated successfully",
      data: transformedBooking,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBookingById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookingId = sanitizeNumber(req.params.bookingId);

    if (!userId) {
      const error = new Error("Invalid user ID");
      error.status = 400;
      throw error;
    }

    await cancelBookingByBookingId(userId, bookingId);

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    next(error);
  }
};

export const getAvailableRoomsBySize = async (req, res, next) => {
  try {
    const check_in = validateDate(req.query.check_in, "Check-in Date");
    const check_out = validateDate(req.query.check_out, "Check-out Date");
    const size = sanitizeString(req.query.size);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    check_in.setHours(0, 0, 0, 0);
    check_out.setHours(0, 0, 0, 0);

    if (check_in >= check_out) {
      const error = new Error("Check-in cannot come after Check-out");
      error.status = 400;
      throw error;
    }

    if (today > check_in) {
      const error = new Error("The selected date already passed");
      error.status = 400;
      throw error;
    }
    if (!check_in || !check_out || !size) {
      const error = new Error("Missing required fields");
      error.status = 400;
      throw error;
    }

    const availableRooms = await getAvailableRoomByRoomSize({
      check_in,
      check_out,
      size,
    });

    res
      .status(200)
      .json({ message: "Available rooms fetched", data: availableRooms });
  } catch (error) {
    next(error);
  }
};
