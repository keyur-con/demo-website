const fs = require("fs");
const path = require("path");

const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

async function backupDatabase() {

    try {

        const backupDir = path.join(__dirname, "../backup");

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }

        const products = await Product.find();
        const users = await User.find();
        const carts = await Cart.find();
        const orders = await Order.find();

        fs.writeFileSync(
            path.join(backupDir, "products-backup.json"),
            JSON.stringify(products, null, 2)
        );

        fs.writeFileSync(
            path.join(backupDir, "users-backup.json"),
            JSON.stringify(users, null, 2)
        );

        fs.writeFileSync(
            path.join(backupDir, "carts-backup.json"),
            JSON.stringify(carts, null, 2)
        );

        fs.writeFileSync(
            path.join(backupDir, "orders-backup.json"),
            JSON.stringify(orders, null, 2)
        );

        console.log("Backup completed");

    } catch (err) {

        console.log("Backup Error:", err.message);
    }
}

module.exports = backupDatabase;