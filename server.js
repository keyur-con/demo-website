require("dotenv").config();
const cron = require("node-cron");
const backupDatabase = require("./utils/backupDatabase");

const connectDB = require("./config/db");
const User = require("./models/User");
const Product = require("./models/Product");
const Cart = require("./models/Cart");
const Order = require("./models/Order");

//const fs = require("fs");
//const path = require("path");

const express = require('express');
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
// const products = require("./products.json");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

cron.schedule("*/10 * * * *", async () => {

    console.log("Running automatic backup...");

    await backupDatabase();
});

// const cartsFilePath = path.join(__dirname, "carts.json");
// const productsFilePath = path.join(__dirname, "products.json");
// const ordersFilePath = path.join(__dirname, "orders.json");
// const usersFilePath = path.join(__dirname, "users.json");

// function readCarts() {
//     try {
//         if (!fs.existsSync(cartsFilePath)) {
//             fs.writeFileSync(cartsFilePath, "{}");
//         }
//         const data = fs.readFileSync(cartsFilePath, "utf-8").trim();
//         return data ? JSON.parse(data) : {};
//     } catch (err) {
//         console.log("Error reading carts.json:", err);
//         return {};
//     }
// }

// function writeCarts(carts) {
//     fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
// }

// function readProducts() {
//     try {
//         if (!fs.existsSync(productsFilePath)) {
//             fs.writeFileSync(productsFilePath, "[]");
//         }
//         const data = fs.readFileSync(productsFilePath, "utf-8").trim();
//         return data ? JSON.parse(data) : [];
//     } catch (err) {
//         console.log("Error reading products:", err);
//         return [];
//     }
// }
// function writeProducts(products) {
//     fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
// }

// function readOrders() {
//     try {
//         if (!fs.existsSync(ordersFilePath)) {
//             fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [] }, null, 2));
//         }
//         const data = fs.readFileSync(ordersFilePath, "utf-8");
//         return JSON.parse(data);
//     } catch (err) {
//         console.log("Error reading orders:", err);
//         return { orders: [] };
//     }
// }

// function writeOrders(data) {
//     fs.writeFileSync(ordersFilePath, JSON.stringify(data, null, 2));
// }

// function readUsers() {
//     if(!fs.existsSync(usersFilePath)) {
//         fs.writeFileSync(usersFilePath, "[]");
//     }
//     const data = fs.readFileSync(usersFilePath, "utf-8").trim();
//     return data ? JSON.parse(data) : [];
// }

// function writeUsers(users) {
//     fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
// }

// function checkAuth(req, res, next) {
//     const authHeader = req.headers["authorization"];

//     if (!authHeader) {
//         return res.status(401).json({ message: "No token" });
//     }

//     const token = authHeader.split(" ")[1];

//     try {
//         const decoded = jwt.verify(token, SECRET);
//         req.user = decoded; 
//         next();
//     } catch (err) {
//         return res.status(401).json({ message: "Invalid token" });
//     }
// }

const checkAuth = require("./middleware/checkAuth");

const productRoutes = require("./routes/productRoutes");

app.use("/products", productRoutes);

const authRoutes = require("./routes/authRoutes");

app.use("/", authRoutes);

const cartRoutes = require("./routes/cartRoutes");

app.use("/cart", cartRoutes);

const orderRoutes = require("./routes/orderRoutes");

app.use("/orders", orderRoutes);



// app.post("/checkout", checkAuth, async (req, res) => {
//     const userId = req.user.userId;
//     const { receiverName, email, mobile, address, items, discount } = req.body;

//     if (!receiverName || !email || !mobile || !address || !items) {
//         return res.status(400).json({ success: false, message: "All fields required" });
//     }
//     try {

//         const tenSecondsAgo = new Date(Date.now() - 10000);

//         const recentOrders = await Order.find({
//             userId,
//             receiverName,
//             mobile,
//             createdAt: { $gte: tenSecondsAgo }
//         });

//         if (recentOrders.length > 0) {
//             const isDuplicate = recentOrders.some(existingOrder => {
//                 if (existingOrder.items.length !== items.length) return false;

//                 return items.every(newItem =>
//                     existingOrder.items.some(oldItem =>
//                         oldItem.productId.toString() === newItem.productId.toString() &&
//                         oldItem.qty === newItem.qty
//                     )
//                 );
//             });

//             if (isDuplicate) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Duplicate order detected. Your order was already placed."
//                 });
//             }
//         }

//         const products = await Product.find();
//         const orderItems = [];
//         let totalAmount = 0;

//         items.forEach(item => {
//             const product = products.find(
//                 p => p._id.toString() === item.productId.toString()
//             );
//             if (!product) return;
//             const itemTotal = product.price * item.qty;
//             totalAmount += itemTotal;
//             orderItems.push({
//                 productId: product._id,
//                 title:     product.title,
//                 price:     product.price,
//                 image:     product.image,
//                 qty:       item.qty,
//                 total:     itemTotal
//             });
//         });

//         const discountAmount = parseFloat(((totalAmount * discount) / 100).toFixed(2));
//         const finalAmount    = parseFloat((totalAmount - discountAmount).toFixed(2));
//         const user = await User.findById(userId);

//         const newOrder = await Order.create({
//             orderId:      "ORD-" + Date.now(),
//             userId,
//             userName:     user?.username || "Unknown",
//             receiverName, email, mobile, address,
//             items:        orderItems,
//             totalAmount, discount, finalAmount,
//             status:       "placed"
//         });

//         res.status(201).json({ success: true, order: newOrder });
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.get("/orders", checkAuth, async (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ error: "Admins only" });
//     }
//     try {
//         const orders = await Order.find().sort({ createdAt: -1 });
//         res.json(orders);
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.get("/orders/my", checkAuth, async (req, res) => {
//     try {
//         const orders = await Order.find({ userId: req.user.userId })
//                                   .sort({ createdAt: -1 });
//         res.json(orders);
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.get("/products", (req, res) => {
//     const products = readProducts();
//     res.json(products);
// });

// app.get("/products", async (req, res) => {

//     try {

//         const products = await Product.find();

//         res.json(products);

//     } catch (err) {

//         res.status(500).json({
//             message: "Server Error"
//         });
//     }
// });

// app.post("/products", checkAuth , async (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "Admins only" });
//     }

//     const { title, price, description, category, image, rating } = req.body;

//     if (!title || !price || !description || !category || !image) {
//         return res.status(400).json({ success: false, message: "All fields are required." });
//     }

//     try {
//         const product = await Product.create({
//             title,
//             price: Number(price),
//             description,
//             category,
//             image,
//             rating: {
//                 rate: Number(rating?.rate) || 0,
//                 count: Number(rating?.count) || 0
//             }
//         });
//         res.status(201).json({ success: true, product });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.delete("/products/:id", checkAuth, async (req, res) => {
//     if (req.user.role !== "admin") {
//         return res.status(403).json({ message: "Admins only" });
//     }

//     try {
//         const deleted = await Product.findByIdAndDelete(req.params.id);
//         if (!deleted) return res.status(404).json({ message: "Product not found" });
//         res.json({ success: true, message: `${deleted.title} deleted` });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.get("/cart", checkAuth, async (req, res) => {
//     try {
//         const cart = await Cart.findOne({ userId: req.user.userId });
//         res.json(cart || { items: [] });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.post("/cart", checkAuth, async (req, res) => {
//     const { productId, qty } = req.body;
//     const userId = req.user.userId;
//     try {
//         let cart = await Cart.findOne({ userId });
//         if (!cart) cart = await Cart.create({ userId, items: [] });

//         const existing = cart.items.find(
//             i => i.productId?.toString() === productId?.toString()
//         );
//         if (existing) {
//             existing.qty += qty;
//         } else {
//             cart.items.push({ productId, qty });
//         }
//         await cart.save();
//         res.json({ message: "Cart updated", cart });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.put("/cart", checkAuth, async (req, res) => {
//     const { productId, qty } = req.body;
//     try {
//         const cart = await Cart.findOne({ userId: req.user.userId });
//         if (!cart) return res.json({ items: [] });

//         const item = cart.items.find(
//             i => i.productId?.toString() === productId?.toString()
//         );
//         if (item) item.qty = qty;
//         await cart.save();
//         res.json({ message: "Cart updated", cart });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.delete("/cart", checkAuth, async (req, res) => {
//     const { productId } = req.body;
//     try {
//         const cart = await Cart.findOne({ userId: req.user.userId });
//         if (!cart) return res.json({ items: [] });

//         cart.items = cart.items.filter(
//             i => i.productId?.toString() !== productId?.toString()
//         );
//         await cart.save();
//         res.json({ message: "Item removed", cart });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.delete("/cart/clear", checkAuth, async (req, res) => {
//     try {
//         await Cart.findOneAndUpdate({ userId: req.user.userId }, { items: [] });
//         res.json({ message: "Cart cleared" });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.post("/signup", async (req, res) => {
//     const { username, password } = req.body;
//     if (!username || !password) {
//         return res.status(400).json({ message: "Username and password required" });
//     }
//     try {
//         const existing = await User.findOne({ username });
//         if (existing) return res.status(400).json({ message: "User already exists" });

//         const hashedPassword = await bcrypt.hash(password, 10);
//         await User.create({ username, password: hashedPassword, role: "user" });
//         res.json({ success: true, message: "Signup successful" });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// app.post("/login", async (req, res) => {
//     const { username, password } = req.body;
//     try {
//         const user = await User.findOne({ username });
//         if (!user) return res.json({ message: "Invalid user" });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.json({ message: "Wrong password" });

//         const token = jwt.sign(
//             { userId: user._id, role: user.role },
//             SECRET,
//             { expiresIn: "7d" }
//         );
//         res.json({ token });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });




app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});