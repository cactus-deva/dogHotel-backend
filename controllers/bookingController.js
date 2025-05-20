
import {
  cancelBookingByBookingId,
  createNewBookingAndInvoice,
  getAvailableRoomByRoomSize,
  getBookingByUserId,
  updateBookingByBookingId,
} from "../services/bookingService.js";

export const createBookingAndInvoice = async (req, res) => {
  const userId = req.user.id;
  const { dog_id, hotelroom_id, check_in, check_out } = req.body;

  try {
    const newBookingAndInvoice = await createNewBookingAndInvoice(userId, {
      dog_id,
      hotelroom_id,
      check_in,
      check_out,
    });

    res.status(200).json({
      message: "Booking and Invoice created Successfully",
      data: newBookingAndInvoice,
    });
  } catch (error) {
    console.error("Create Booking + Invoice Error:", error.message);
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const myBookings = await getBookingByUserId(userId);

    res.status(200).json({
      message: "Fetched your bookings successsfully",
      data: myBookings,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch bookings", error: error.message });
  }
};

//คงuser_id และ booking_id ไว้เหมือนเดิม แก้ไขแค่ห้อง, checkin, checkout, status
export const updateBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const userId = req.user.id;
    const { hotelroom_id, check_in, check_out } = req.body;
    if (isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    const updateBookingAndInvoice = await updateBookingByBookingId(
      userId,
      bookingId,
      { hotelroom_id, check_in, check_out }
    );

    res.status(200).json({
      message: "Booking and Invoive updated successfully",
      data: updateBookingAndInvoice,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const cancelBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);

    await cancelBookingByBookingId(userId, bookingId);

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const getAvailableRoomsBySize = async (req, res) => {
  try {
    const { check_in, check_out, size } = req.query;
    if (!check_in || !check_out || !size) {
      return res
        .status(400)
        .json({ message: "Missing required query parameters" });
    }

    const availableRooms = await getAvailableRoomByRoomSize({check_in, check_out, size})

    res
      .status(200)
      .json({ message: "Available rooms fetched", data: availableRooms });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message:  error.message });
  }
};
