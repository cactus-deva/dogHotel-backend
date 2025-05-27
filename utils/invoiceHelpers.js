import pool from "../db/connect.js";


export const checkInvoiceIsNum = (invoiceId) => {
    const num = Number(invoiceId)
    if (isNaN(num)) {
        const error = new Error("Invoice ID type must be a valid number");
        error.status = 400;
        throw error;
      }
      return num;
    }

    export const checkInvoiceExist = async (invoiceId) => {
        const sql = `SELECT * FROM invoices WHERE id = $1`
        const result = await pool.query(sql, [invoiceId])
        
        if(result.rowCount === 0) {
            const error = new Error("This invoice ID is not exist")
            error.status = 404;
            throw error
        }
        return result.rows[0]
    }