
export const errorHandler = (err, req, res, next) => {
    console.error("Error:", err.message)

    const statusCode = err.status || 500;
    res.status(statusCode).json({message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && {stack : err.stack})
    })
}