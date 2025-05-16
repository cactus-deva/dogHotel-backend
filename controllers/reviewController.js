import pool from "../db/connect.js";

export const createReview = async (req, res) => {
  try {
    const { user_id, booking_id, rating, comment } = req.body;

    //เช็คว่า booking นี้มีจริงและ status= 'confirmed' or 'rescheduled' ถึงจะรีวิวได้
    const bookingCheckSql = `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'confirmed' OR status = 'rescheduled'`;
    const bookingCheck = await pool.query(bookingCheckSql, [
      booking_id,
      user_id,
    ]);

    if (bookingCheck.rowCount === 0) {
      return res
        .status(400)
        .json({ message: "Cannot Review, Booking Not Confirmed" });
    }

    //เช็คว่ามี rewview booking นี้รึยัง
    const reviewExistSql = `SELECT * FROM reviews WHERE booking_id = $1`;
    const reviewExist = await pool.query(reviewExistSql, [booking_id]);

    if (reviewExist.rowCount > 0) {
      return res
        .status(400)
        .json({ message: "Review already exists for this booking" });
    }

    //ถ้า่ผ่านหมดก็ insert โลด
    const insertSql = `INSERT INTO reviews (user_id, booking_id, rating, comment)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
    const response = await pool.query(insertSql, [
      user_id,
      booking_id,
      rating,
      comment,
    ]);

    res
      .status(200)
      .json({ message: "Review Created Successfully", data: response.rows[0] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create review", error: error.message });
  }
};

export const getReviewByUserId = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const sql = `
  SELECT 
    reviews.*, 
    bookings.check_in, 
    bookings.check_out, 
    hotelrooms.name AS room_name,
    dogs.name AS dog_name
  FROM reviews
  JOIN bookings ON reviews.booking_id = bookings.id
  JOIN dogs ON bookings.dog_id = dogs.id
  JOIN hotelrooms ON bookings.hotelroom_id = hotelrooms.id
  WHERE reviews.user_id = $1
  ORDER BY reviews.created_at DESC
`;

    const response = await pool.query(sql, [userId]);

    res
      .status(200)
      .json({
        message: "Get user's reviews successfully",
        data: response.rows,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get reviews", error: error.message });
  }
};

export const updateReviewById = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    //เช็คว่า review นี้เป็นของ user นี้ไหม
    const checkSql = `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`;
    const check = await pool.query(checkSql, [reviewId, userId]);

    if (check.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this review" });
    }

    const updateSql = `UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *`;
    const response = await pool.query(updateSql, [rating, comment, reviewId]);

    res
      .status(200)
      .json({ message: "Review updated successfully", data: response.rows[0] });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update review", error: error.message });
  }
};

export const deleteReviewById = async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user.id;

    //เช็คว่า review ของ user นี้ใช่ไหม
    const checkSql = `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`;
    const check = await pool.query(checkSql, [reviewId, userId]);

    if (check.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this review" });
    }

    const deleteSql = `DELETE FROM reviews WHERE id = $1`;
    await pool.query(deleteSql, [reviewId]);

    res.status(200).json({ message: "Review Deleted Successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete review", error: error.message });
  }
};
