const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT_SECRET;

async function signup(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({
            message: "Username and password required"
        });
    }
    try {
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            password: hashedPassword,
            role: "user"
        });
        res.json({
            success: true,
            message: "Signup successful"
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}

async function login(req, res) {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.json({
                message: "Invalid user"
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({
                message: "Wrong password"
            });
        }
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            SECRET,
            {
                expiresIn: "7d"
            }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}



module.exports = {
    signup,
    login
};