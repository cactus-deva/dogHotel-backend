import {
  cancelBookingByBookingId,
  createNewBookingAndInvoice,
  getAvailableRoomByRoomSize,
  getBookingByUserId,
  updateBookingByBookingId,
} from "../services/bookingService.js";

export const createBookingAndInvoice = async (req, res, next) => {
  const userId = req.user.id;
  const { dog_id, hotelroom_id, check_in, check_out } = req.body;
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const today = new Date();
  try {
    //check date
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);
    checkOutDate.setHours(0, 0, 0, 0);
    if (!check_in || !check_out) {
      const error = new Error("Please select check-in and check-out date");
      error.status = 400;
      throw error;
    }
    if (today > checkInDate) {
      const error = new Error("Selected date already passed");
      error.status = 400;
      throw error;
    }

    if (checkInDate >= checkOutDate) {
      const error = new Error("Invalid check-in / check-out date");
      error.status = 400;
      throw error;
    }

    if (!dog_id || !hotelroom_id || !check_in || !check_out) {
      const error = new Error("Please fill all fields before book");
      error.status = 400;
      throw error;
    }

    const newBookingAndInvoice = await createNewBookingAndInvoice(userId, {
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
    const bookingId = parseInt(req.params.bookingId);
    const userId = req.user.id;
    const { hotelroom_id, check_in, check_out, dog_id } = req.body;

    if (!hotelroom_id || !check_in || !check_out || !dog_id) {
      const error = new Error("Please fill all fields before update booking");
      error.status = 400;
      throw error;
    }

    if (isNaN(bookingId)) {
      const error = new Error("Invalid booking ID format");
      error.status = 400;
      throw error;
    }

    const updatedBooking = await updateBookingByBookingId(userId, bookingId, {
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
    const bookingId = parseInt(req.params.bookingId);

    if (!userId || isNaN(bookingId)) {
      const error = new Error("Invalid user ID or booking ID");
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
    const { check_in, check_out, size } = req.query;
    const inDate = new Date(check_in);
    const outDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    inDate.setHours(0, 0, 0, 0);
    outDate.setHours(0, 0, 0, 0);

    if (isNaN(inDate) || isNaN(outDate)) {
      const error = new Error("Invalid date format");
      error.status = 400;
      throw error;
    }

    if (inDate >= outDate) {
      const error = new Error("Check-in cannot come after Check-out");
      error.status = 400;
      throw error;
    }

    if (today > inDate) {
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
