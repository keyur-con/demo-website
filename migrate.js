const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const User  = require("./models/User");
const Order = require("./models/Order");
const Cart  = require("./models/Cart");

async function migrate() {
    await mongoose.connect("mongodb://127.0.0.1:27017/shopDB");
    console.log("Connected to MongoDB");

    
    const users = JSON.parse(
        fs.readFileSync(path.join(__dirname, "users.json"), "utf-8")
    );
    await User.deleteMany({});
    await User.insertMany(users.map(u => ({
        username: u.username,
        password: u.password,  
        role:     u.role
    })));
    console.log("Users migrated:", users.length);

    
    await Order.deleteMany({});
    console.log("Orders collection cleared — starting fresh");

    
    await Cart.deleteMany({});
    console.log("Old carts cleared — users start with fresh carts");

    console.log("\n Migration complete!");
    process.exit();
}

migrate().catch(err => {
    console.log("Migration failed:", err.message);
    process.exit(1);
});