import pool from "./connect.js";

export const keepDatabaseAlive = async () => {
    try {
        await pool.query("SELECT 1");
        console.log("Keep DB alive pinged"); 
    } catch (error) {
        console.error("Keep DB alive failed", error.message)
    }
}