const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

function checkAuth(req, res, next) {

    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({
            message: "No token"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, SECRET);
        // console.log("Decoded token:", decoded);
        req.user = decoded;

        next();

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

module.exports = checkAuth;