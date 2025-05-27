import pool from "../db/connect.js";

export const createNewDog = async (
  { name, breed, age, weight, health_conditions },
  userId
) => {
  const checkSql = `SELECT * FROM dogs WHERE user_id = $1 AND name = $2`;
  const checkExistDog = await pool.query(checkSql, [userId, name]);

  if (checkExistDog.rowCount > 0) {
    const error = new Error("You already have a dog with this name");
    error.status = 409;
    throw error;
  }

  const sql = `INSERT INTO dogs (user_id, name, breed, age, weight, health_conditions)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

  const values = [
    userId,
    name,
    breed,
    age,
    weight,
    health_conditions || "none",
  ];
  const response = await pool.query(sql, values);
  return response.rows[0];
};

export const getDogsByUserId = async (userId) => {
  const sql = `SELECT id, name, breed, age, weight, health_conditions
        FROM dogs
        WHERE user_id = $1
        ORDER BY created_at DESC`;

  const response = await pool.query(sql, [userId]);
  return response.rows;
};

export const updateDogsByDogId = async ({
  dogId,
  userId,
  name,
  breed,
  age,
  weight,
  health_conditions,
}) => {
  const checkSql = `SELECT * FROM dogs WHERE id = $1 AND user_id = $2`;
  const checkDog = await pool.query(checkSql, [dogId, userId]);

  if (checkDog.rowCount === 0) {
    const error = new Error("You are not allowed to update this dog");
    error.status = 403;
    throw error;
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

  return response.rows[0];
};

export const deleteDogByDogId = async (userId, dogId) => {
  const checkSql = `SELECT * FROM dogs
        WHERE id = $1 AND user_id = $2`;
  const checkDog = await pool.query(checkSql, [dogId, userId]);

  if (checkDog.rowCount === 0) {
    const error = new Error("You are not allowed to delete this dog");
    error.status = 403;
    throw error;
  }

  const deleteSql = `DELETE FROM dogs WHERE id = $1`;
  await pool.query(deleteSql, [dogId]);
};
