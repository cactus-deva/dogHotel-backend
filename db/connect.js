import pkg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const {Pool} = pkg

const pool = new Pool ({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
})

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1)
})

export default pool