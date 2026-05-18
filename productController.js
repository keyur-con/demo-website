const Product = require("../models/Product");

async function getProducts(req, res) {

    try {

        const products = await Product.find();

        res.json(products);

    } catch (err) {

        res.status(500).json({
            message: "Server Error"
        });
    }
}

async function createProduct(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    const { title, price, description, category, image, rating } = req.body;

    if (!title || !price || !description || !category || !image) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    try {

        const product = await Product.create({
            title,
            price: Number(price),
            description,
            category,
            image,
            rating: {
                rate: Number(rating?.rate) || 0,
                count: Number(rating?.count) || 0
            }
        });

        res.status(201).json({
            success: true,
            product
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}

async function deleteProduct(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    try {

        const deleted = await Product.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: `${deleted.title} deleted`
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}

module.exports = {
    getProducts,
    createProduct,
    deleteProduct
};