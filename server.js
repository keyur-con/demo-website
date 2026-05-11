const fs = require("fs");
const path = require("path");

const express = require('express');
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "mysecret123";
// const products = require("./products.json");

const app = express();

app.use(cors());
app.use(express.json());


const cartsFilePath = path.join(__dirname, "carts.json");
const productsFilePath = path.join(__dirname, "products.json");
const ordersFilePath = path.join(__dirname, "orders.json");
const usersFilePath = path.join(__dirname, "users.json");

function readCarts() {
    try {
        if (!fs.existsSync(cartsFilePath)) {
            fs.writeFileSync(cartsFilePath, "{}");
        }
        const data = fs.readFileSync(cartsFilePath, "utf-8").trim();
        return data ? JSON.parse(data) : {};
    } catch (err) {
        console.log("Error reading carts.json:", err);
        return {};
    }
}

function writeCarts(carts) {
    fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
}

function readProducts() {
    try {
        if (!fs.existsSync(productsFilePath)) {
            fs.writeFileSync(productsFilePath, "[]");
        }
        const data = fs.readFileSync(productsFilePath, "utf-8").trim();
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.log("Error reading products:", err);
        return [];
    }
}
function writeProducts(products) {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
}

function readOrders() {
    try {
        if (!fs.existsSync(ordersFilePath)) {
            fs.writeFileSync(ordersFilePath, JSON.stringify({ orders: [] }, null, 2));
        }
        const data = fs.readFileSync(ordersFilePath, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        console.log("Error reading orders:", err);
        return { orders: [] };
    }
}

function writeOrders(data) {
    fs.writeFileSync(ordersFilePath, JSON.stringify(data, null, 2));
}

function readUsers() {
    if(!fs.existsSync(usersFilePath)) {
        fs.writeFileSync(usersFilePath, "[]");
    }
    const data = fs.readFileSync(usersFilePath, "utf-8").trim();
    return data ? JSON.parse(data) : [];
}

function writeUsers(users) {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

function checkAuth(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

app.post("/checkout",checkAuth, (req, res) => {
    //const { userId, userName, receiverName, email, mobile, address, items, discount } = req.body;
    const userId = req.user.userId;
    const receiverName = req.body.receiverName;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const address = req.body.address;
    const items = req.body.items;
    const discount = req.body.discount;

    if (!userId || !receiverName || !email || !mobile || !address || !items) {
        return res.status(400).json({ success: false, message: "All fields required" });
    }
 
    const products = readProducts(); 
    const orderItems = [];

    let totalAmount = 0;

    items.forEach(item => {
        const product = products.find(p => p.id === item.productId);

        if (!product) return;

        const itemTotal = product.price * item.qty;

        totalAmount += itemTotal;

        orderItems.push({
            productId: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            qty: item.qty,
            total: itemTotal
        });
    });

    const discountAmount = parseFloat(((totalAmount * discount) / 100).toFixed(2));
    const finalAmount = parseFloat((totalAmount - discountAmount).toFixed(2));
    const users = readUsers();
    const userObj = users.find(u => u.id == userId);

    const newOrder = {
        orderId: "ORD-" + Date.now(),
        userId,
        userName: userObj ? userObj.username : "Unknown",        
        receiverName,
        email,
        mobile,
        address,
        items: orderItems,
        totalAmount,
        discount,
        finalAmount,
        createdAt: new Date().toISOString()
    };

    const db = readOrders();
    db.orders.push(newOrder);
    writeOrders(db);

    res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order: newOrder
    });
});

app.get("/orders", checkAuth, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admins only" });
    }

    const db = readOrders();
    res.json(db.orders);
});

app.get("/orders/my", checkAuth, (req, res) => {
    const userId = req.user.userId;

    const db = readOrders();
    const userOrders = db.orders.filter(order => order.userId == userId);

    res.json(userOrders);
});

app.get("/products", (req, res) => {
    const products = readProducts();
    res.json(products);
});

app.post("/products", checkAuth , (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admins only" });
    }

    const { title, price, description, category, image, rating } = req.body;

    if (!title || !price || !description || !category || !image) {
        return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const products = readProducts();

    const newId =
        products.length > 0
            ? Math.max(...products.map(p => p.id)) + 1
            : 1;

    const newProduct = {
        id: newId,
        title,
        price: Number(price),
        description,
        category,
        image,
        rating: {
            rate: Number(rating?.rate) || 0,
            count: Number(rating?.count) || 0
        }
    };

    products.push(newProduct);
    writeProducts(products);

    res.status(201).json({ success: true, product: newProduct });
});

app.delete("/products/:id", checkAuth, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admins only" });
    }

    const id = Number(req.params.id);

    let products = readProducts();

    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: "Product not found." });
    }

    const deleted = products.splice(index, 1)[0];

    writeProducts(products);

    res.json({ success: true, message: `${deleted.title} deleted.` });
});

app.get("/cart", checkAuth, (req, res) => {
    const userId = req.user.userId;
    const carts = readCarts();
    res.json(carts[userId] || { items: [] });
});

app.post("/cart", checkAuth, (req, res) => {
    const { productId, qty } = req.body;
    const userId = req.user.userId;

    if (!userId || !productId) {
        return res.status(400).json({ message: "Missing userId or productId" });
    }

    const carts = readCarts();

    if (!carts[userId]) {
        carts[userId] = { items: [] };
    }

    const existing = carts[userId].items.find(i => i.productId === productId);

    if (existing) {
        existing.qty += qty;
    } else {
        carts[userId].items.push({ productId, qty });
    }

    writeCarts(carts);

    res.json({ message: "Cart updated", cart: carts[userId] });
});

app.put("/cart", checkAuth, (req, res) => {
    const { productId, qty } = req.body;
    const userId = req.user.userId;

    const carts = readCarts();

    if (!carts[userId]) return res.json({ items: [] });

    const item = carts[userId].items.find(i => i.productId === productId);
    if (item) item.qty = qty;

    writeCarts(carts);

    res.json({ message: "Cart updated", cart: carts[userId] });
});

app.delete("/cart", checkAuth, (req, res) => {
    const { productId } = req.body;
    const userId = req.user.userId;

    const carts = readCarts();

    if (!carts[userId]) return res.json({ items: [] });

    carts[userId].items = carts[userId].items.filter(
        i => i.productId !== productId
    );

    writeCarts(carts);

    res.json({ message: "Item removed", cart: carts[userId] });
});

app.delete("/cart/clear", checkAuth, (req, res) => {
    const userId = req.user.userId;

    const carts = readCarts();
    carts[userId] = { items: [] };

    writeCarts(carts);

    res.json({ message: "Cart cleared" });
});

app.post("/signup", async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    const users = readUsers();
    const existing = users.find(u => u.username === username);

    if (existing) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: Date.now(),
        username,
        password: hashedPassword,
        role: "user"
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ success: true, message: "Signup successful" });
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const users = readUsers(); 
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.json({ message: "Invalid user" });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.json({ message: "Wrong password" });
    }

   
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        SECRET,
        { expiresIn: "7d" }
    );

    res.json({
        token: token
    });
});




app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});