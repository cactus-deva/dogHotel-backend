import pool from "../db/connect.js";

export const createReviewService = async ({
  user_id,
  booking_id,
  rating,
  comment,
}) => {

  //เช็คว่า booking นี้มีจริงและ status= 'confirmed' or 'rescheduled' ถึงจะรีวิวได้
  const bookingCheckSql = `SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND status = 'confirmed'`;
  const bookingCheck = await pool.query(bookingCheckSql, [booking_id, user_id]);

  if (bookingCheck.rowCount === 0) {
    const error = new Error("Cannot Review, Booking not confirmed");
    error.status = 400;
    throw error;
  }

  //เช็คว่ามี rewview booking นี้รึยัง
  const reviewExistSql = `SELECT * FROM reviews WHERE booking_id = $1`;
  const reviewExist = await pool.query(reviewExistSql, [booking_id]);
  if (reviewExist.rowCount > 0) {
    const error = new Error("Review already exist for this booking");
    error.status = 400;
    throw error;
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

  return response.rows[0];
};

export const getReviewByUserIdService = async (userId) => {
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

  if(response.rowCount === 0) {
    const error = new Error("Cannot find reviews for this User ID");
      error.status = 400;
      throw error;
  }
  return response.rows
};

export const updateReviewByIdService = async (reviewId, userId, {rating, comment}) => {
    //เช็คว่า review นี้เป็นของ user นี้ไหม
    const checkSql = `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`;
    const check = await pool.query(checkSql, [reviewId, userId]);
   
    if (check.rowCount === 0) {
      const error = new Error("You are not allowed to update this review")
      error.status = 403
      throw error
    }

    const updateSql = `UPDATE reviews SET rating = $1, comment = $2 WHERE id = $3 RETURNING *`;
    const response = await pool.query(updateSql, [rating, comment, reviewId]);
    return response.rows[0]

}


export const deleteReviewByIdService = async (reviewId, userId) => {
    //เช็คว่า review ของ user นี้ใช่ไหม
    const checkSql = `SELECT * FROM reviews WHERE id = $1 AND user_id = $2`;
    const check = await pool.query(checkSql, [reviewId, userId]);

    if (check.rowCount === 0) {
      const error = new Error("You are not allowed to delete this review")
      error.status = 403
      throw error;
    }

    const deleteSql = `DELETE FROM reviews WHERE id = $1`;
    await pool.query(deleteSql, [reviewId]);


}