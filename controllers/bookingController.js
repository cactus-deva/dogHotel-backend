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
    if (!dog_id || !hotelroom_id || !check_in || !check_out) {
      return res.status(400).json({message: "please fill all fields before book"})
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
      room_name,
      price_per_night: total_price,
      hotelroom_id,
      dog_id,
      status: "confirmed",
    };

    res.status(200).json({
      message: "Booking and Invoice created Successfully",
      data: transformedBooking,
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
    if(!userId) {
      return res.status(400).json({message: "User ID token not found"})
    }

    const myBookings = await getBookingByUserId(userId);

    res.status(200).json({
      message: "Fetched your bookings successsfully",
      data: myBookings,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Cannot fetch bookings"});
  }
};

//คงuser_id และ booking_id ไว้เหมือนเดิม แก้ไขแค่ห้อง, checkin, checkout
export const updateBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    const userId = req.user.id;
    const { hotelroom_id, check_in, check_out, dog_id } = req.body;
    
    if(!hotelroom_id || !check_in || !check_out || !dog_id) {
      return res.status(400).json({message: "Please fill all fields before update"})
    }
    
    if (isNaN(bookingId)) {
      return res.status(400).json({ message: "Invalid Booking ID format" });
    }

    const updatedBooking = await updateBookingByBookingId(
      userId,
      bookingId,
      { hotelroom_id, check_in, check_out, dog_id }
    );

    const transformedBooking = {
      ...updatedBooking, booking_id: updatedBooking.id
    }
    delete transformedBooking.id

    res.status(200).json({
      message: "Booking and Invoive updated successfully",
      data: transformedBooking,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Cannot edit booking"
    });
  }
};

export const cancelBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.bookingId);

    if(!userId || isNaN(bookingId)) {
      return res.status(400).json({message: "User ID or booking ID is incorrect"})
    }

    await cancelBookingByBookingId(userId, bookingId);

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("error cancel booking", error);
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

    const availableRooms = await getAvailableRoomByRoomSize({
      check_in,
      check_out,
      size,
    });

    res
      .status(200)
      .json({ message: "Available rooms fetched", data: availableRooms });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Cannot cancel booking" });
  }
};
