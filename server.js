const express = require('express');
const cors = require('cors');
// const products = require("./products.json");

const app = express();

app.use(cors());
app.use(express.json());

const fs = require("fs");
const path = require("path");
const cartsFilePath = path.join(__dirname, "carts.json");
const productsFilePath = path.join(__dirname, "products.json");
const ordersFilePath = path.join(__dirname, "orders.json");

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

app.post("/checkout", (req, res) => {
    const { userId, userName, receiverName, email, mobile, address, items, discount } = req.body;

    if (!userId || !userName || !receiverName || !email || !mobile || !address || !items) {
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

    const discountAmount = ((totalAmount * discount) / 100).toFixed(2);
    const finalAmount = totalAmount - discountAmount;

    const newOrder = {
        orderId: "ORD-" + Date.now(),
        userId,
        userName,        
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

app.get("/orders", (req, res) => {
    const role = req.headers["role"];

    if (role !== "admin") {
        return res.status(403).json({ error: "Admins only" });
    }

    const db = readOrders();
    res.json(db.orders);
});

app.get("/orders/:userId", (req, res) => {
    const { userId } = req.params;

    const db = readOrders();

    const userOrders = db.orders.filter(order => order.userId == userId);

    res.json(userOrders);
});

app.get("/products", (req, res) => {
    const products = readProducts();
    res.json(products);
});

app.post("/products", (req, res) => {
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

app.delete("/products/:id", (req, res) => {
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

app.get("/cart/:userId", (req, res) => {
    const userId = req.params.userId;
    const carts = readCarts();
    res.json(carts[userId] || { items: [] });
});

app.post("/cart", (req, res) => {
    const { userId, productId, qty } = req.body;

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

app.put("/cart", (req, res) => {
    const { userId, productId, qty } = req.body;

    const carts = readCarts();

    if (!carts[userId]) return res.json({ items: [] });

    const item = carts[userId].items.find(i => i.productId === productId);
    if (item) item.qty = qty;

    writeCarts(carts);

    res.json({ message: "Cart updated", cart: carts[userId] });
});

app.delete("/cart", (req, res) => {
    const { userId, productId } = req.body;

    const carts = readCarts();

    if (!carts[userId]) return res.json({ items: [] });

    carts[userId].items = carts[userId].items.filter(
        i => i.productId !== productId
    );

    writeCarts(carts);

    res.json({ message: "Item removed", cart: carts[userId] });
});

app.delete("/cart/clear/:userId", (req, res) => {
    const userId = req.params.userId;

    const carts = readCarts();
    carts[userId] = { items: [] };

    writeCarts(carts);

    res.json({ message: "Cart cleared" });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});