import jwt from 'jsonwebtoken'

export const authenticateToken = (req,res,next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({message: "No Token Provided"})
    }
    const token = authHeader.split(" ")[1];

    if(!token) {
        return res.status(401).json({message: "Missing Token"})
    } 
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded //เก็บ user ไว้ใน req.user
        console.log(req.user,'req.user<<')
        next()
    } catch (error) {
        res.status(401).json({message: "Invalid Token"})
    }
}

export const authorizeSelf = (req,res, next) => {
    const userId = parseInt(req.params.id);
    if(req.user.id !== userId) {
        return res.status(403).json({message: "You can ONLY ACCESS your own data"})
    }
    next()
}