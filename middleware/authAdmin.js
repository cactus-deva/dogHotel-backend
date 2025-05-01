import jwt from 'jsonwebtoken'

export const authenticateAdmin = (req,res,next) => {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({message: "No Token Provided"})
        }

        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if(decoded.role !== 'admin') {
            return res.status(403).json({message: "You are not authrozied as ADMIN"})
        }
        req.admin = decoded; //เก็บข้อมูล admin ไว้ใน req.admin
        next()

    } catch (error) {
        return res.status(401).json({ message: 'Token is invalid or expired', error: error.message });
    }
}