import pool from "../db/connect.js";

export const createDog = async (req, res) => {
  try {
    const { name, breed, age, weight, health_conditions } = req.body;
    if (!name || !breed || !age || !weight) {
      return res
        .status(400)
        .json({ message: "Please provide all required data" });
    }
    const userId = req.user.id;

    const checkSql = `SELECT * FROM dogs WHERE user_id = $1 AND name = $2`;
    const checkExistDog = await pool.query(checkSql, [userId, name]);

    if (checkExistDog.rowCount > 0) {
      return res
        .status(409)
        .json({ message: "You already have a dog with this name" });
    }

    const sql = `INSERT INTO dogs (user_id, name, breed, age, weight, health_conditions)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

    const values = [
      userId,
      name,
      breed,
      age,
      weight,
      health_conditions || null,
    ];
    const response = await pool.query(sql, values);

    res
      .status(200)
      .json({ message: "Dog Create Successfully", data: response.rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create dog",
      error: error.message,
    });
  }
};

//เรียกดูข้อมูลหมาของ user
export const getMyDogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `SELECT id, name, breed, age, weight, health_conditions
        FROM dogs
        WHERE user_id = $1
        ORDER BY created_at DESC`;

    const response = await pool.query(sql, [userId]);

    res
      .status(200)
      .json({ message: "Fetch your dogs successfully", data: response.rows });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dogs",
      error: error.message,
    });
  }
};

export const updateDogById = async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);
    if (isNaN(dogId)) {
      return res.status(200).json({ message: "Invalid Dog ID format" });
    }
    const { name, breed, age, weight, health_conditions } = req.body;
    const userId = req.user.id;

    const checkSql = `SELECT * FROM dogs WHERE id = $1 AND user_id = $2`;
    const checkDog = await pool.query(checkSql, [dogId, userId]);

    if (checkDog.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this dog" });
    }

    const updateSql = `UPDATE dogs 
        SET name = $1, breed = $2, age = $3, weight = $4, health_conditions = $5
        WHERE id = $6 RETURNING *`;

    const response = await pool.query(updateSql, [
      name,
      breed,
      age,
      weight,
      health_conditions || "none",
      dogId,
    ]);
    res
      .status(200)
      .json({ message: "Dog Update Successfully", data: response.rows[0] });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update dog",
      error: error.message,
    });
  }
};

export const deleteDogById = async (req, res) => {
  try {
    const dogId = parseInt(req.params.id);

    if (isNaN(dogId)) {
      return res.status(400).json({ message: "Invalid Dog ID format" });
    }

    const userId = req.user.id;
    const checkSql = `SELECT * FROM dogs
        WHERE id = $1 AND user_id = $2`;
    const checkDog = await pool.query(checkSql, [dogId, userId])

    if(checkDog.rowCount === 0 ) {
        return res.status(403).json({message: "You are not allowed to delete this dog"})
    }

    const deleteSql = `DELETE FROM dogs WHERE id = $1`
    const response = await pool.query(deleteSql, [dogId])

    res.status(200).json({message: "Dog Deleted Successfully"})
  
} catch (error) {
    res.status(500).json({
        message: "Failed to delete dog",
        error: error.message
      });
  }
};

