import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import userRouter from './routes/userRouter.js'
import adminRouter from './routes/adminRouter.js'
import dogRouter from './routes/dogRouter.js'
import bookingRouter from './routes/bookingRouter.js'
import reviewRouter from './routes/reviewRouter.js'
import userInvoiceRouter from './routes/userInvoiceRouter.js'
import adminInvoiceRouter from './routes/adminInvoiceRouter.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

app.use(cors())
app.use(express.json())

//admin only
app.use('/api/admin', adminRouter)
app.use('/api/admin/invoices', adminInvoiceRouter)

//users only
app.use('/api/users', userRouter)
app.use('/api/users/invoices', userInvoiceRouter)
app.use('/api/users/dogs', dogRouter)
app.use('/api/users/booking', bookingRouter)
app.use('/api/users/review', reviewRouter)


app.listen(PORT, () =>{
    console.log(`Server is running at port ${PORT}`);
    
})
