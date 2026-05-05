const express = require('express');
const cors = require('cors');
const products = require("./products.json");

const app = express();

app.use(cors());
app.use(express.json());

const orders = [];

app.post("/checkout", (req, res) => {
    const {name, email, mobile,address, items } = req.body;
    if(!name || !email || !mobile || !address){
        res.status(400).json({success: false, message: "All fields are required."});
        return;
    }
    const order = {
        orderId: "ORD-" + Date.now(),
        name,
        email,
        mobile,
        address,
        items
    };
    orders.push(order);
    console.log("New order received: ", order.orderId);
    res.status(201).json({success: true, message: "Order placed successfully.", order});
});

app.get("/orders", (req, res) => {
    const role = req.headers["role"];

    if (role !== "admin") {
        res.status(403).json({ error: "Access denied. Admins only." });
        return;
    }

    res.json(orders);
    
});

app.get("/products", (req, res) => {
    res.json(products);
});

app.post("/products", (req, res) => {
    const { title, price, description, category, image, rating } = req.body;

    if (!title || !price || !description || !category || !image) {
        res.status(400).json({ success: false, message: "All fields are required." });
        return;
    }

    const newId = products.length > 0
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

    res.status(201).json({ success: true, message: "Product added!", product: newProduct });
});

app.delete("/products/:id", (req, res) => {
    const id = Number(req.params.id);
    const index = products.findIndex(p => p.id === id);

    if (index === -1) {
        res.status(404).json({ success: false, message: "Product not found." });
        return;
    }

    const deleted = products.splice(index, 1)[0];
    res.json({ success: true, message: `${deleted.title} deleted.` });
});

app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});