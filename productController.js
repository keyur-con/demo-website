const Product = require("../models/Product");

async function getProducts(req, res) {

    try {

        
        const products = await Product.find({
            isDeleted: false
        });

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

    const {
        title,
        price,
        description,
        category,
        image,
        rating,
        stock
    } = req.body;

    if (!title || !price || !description || !category || !image) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    try {

        const parsedStock = Number(stock);

        // validate stock
        if (
            stock !== undefined &&
            (isNaN(parsedStock) || parsedStock < 0)
        ) {
            return res.status(400).json({
                message: "Stock cannot be negative"
            });
        }

        const finalStock =
            stock === undefined ? 100 : parsedStock;

        const product = await Product.create({
            title,
            price: Number(price),
            description,
            category,
            image,
            rating: {
                rate: Number(rating?.rate) || 0,
                count: Number(rating?.count) || 0
            },

            stock: finalStock,
            inStock: finalStock > 0,
            isDeleted: false
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

        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
                inStock: false
            },
             { returnDocument: "after" }
        );

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.json({
            success: true,
            message: `${product.title} removed from store`
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}



async function toggleStock(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        product.inStock = !product.inStock;

        
        if (product.inStock && product.stock === 0) {
            product.stock = 1;
        }

        await product.save();
        
        res.json({
            success: true,
            message: `Marked as ${product.inStock ? "In Stock" : "Out of Stock"}`,
            inStock: product.inStock,
            stock: product.stock
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}



async function updateStock(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
        return res.status(400).json({
            message: "Valid stock quantity required"
        });
    }

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        product.stock = Number(stock);

        
        product.inStock = Number(stock) > 0;

        await product.save();

        res.json({
            success: true,
            message: "Stock updated",
            stock: product.stock,
            inStock: product.inStock
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}



async function updateProductStatus(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    const { status } = req.body;

    const validStatuses = [
        "active",
        "out_of_stock",
        "unavailable"
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status"
        });
    }

    try {

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        product.status = status;

        
        if (status !== "active") {
            product.inStock = false;
        } else {
            product.inStock = product.stock > 0;
        }

        await product.save();

        res.json({
            success: true,
            message: `Status updated to ${status}`,
            product
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}



async function getAdminProducts(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    try {

        const products = await Product.find()
            .sort({
                isDeleted: 1,
                createdAt: -1
            });

        res.json(products);

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}



async function restoreProduct(req, res) {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admins only"
        });
    }

    try {

        // const product = await Product.findByIdAndUpdate(
        //     req.params.id,
        //     {
        //         isDeleted: false,
        //         inStock: true
        //     },
        //     { new: true }
        // );

        // if (!product) {
        //     return res.status(404).json({
        //         message: "Product not found"
        //     });
        // }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        product.isDeleted = false;
        product.inStock = product.stock > 0;

        await product.save();

        res.json({
            success: true,
            message: `${product.title} restored`,
            product
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}

async function getDeletedProducts(req, res) {
    try {
        const deletedProducts = await Product.find({
            isDeleted: true
        });

        res.json({
            success: true,
            products: deletedProducts
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch deleted products"
        });
    }
}



module.exports = {
    getProducts,
    createProduct,
    deleteProduct,
    toggleStock,
    updateStock,
    getAdminProducts,
    restoreProduct,
    updateProductStatus,
    getDeletedProducts
};