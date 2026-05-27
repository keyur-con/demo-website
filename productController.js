const Product = require("../models/Product");

// async function getProducts(req, res) {

//     try {

        
//         const products = await Product.find({
//             isDeleted: false
//         });

//         res.json(products);

//     } catch (err) {

//         res.status(500).json({
//             message: "Server Error"
//         });
//     }
// }

async function getProducts(req, res) {
    try {

        // --- 1. PAGINATION params from URL query ---
        const page  = parseInt(req.query.page)  || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip  = (page - 1) * limit;

        // --- 2. BUILD FILTER QUERY ---
        const query = { isDeleted: false };

        // Search — only if search param exists
        // if (req.query.search && req.query.search.trim() !== "") {
        //     query.title = {
        //         $regex: req.query.search.trim(),
        //         $options: "i"   // case insensitive
        //     };
        // }

        if (req.query.search && req.query.search.trim() !== "") {
            const searchRegex = {
                $regex: req.query.search.trim(),
                $options: "i"
            };
            query.$or = [
                { title:       searchRegex },
                { description: searchRegex },
                { category:    searchRegex }
            ];
        }

        // Category filter
        // if (req.query.category && req.query.category.trim() !== "") {
        //     query.category = req.query.category.trim();
        // }

        if (req.query.categories && req.query.categories.trim() !== "") {
            const categoryList = req.query.categories.split(",").map(c => c.trim());
            query.category = { $in: categoryList };
        }

        // Price range
        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
        }

        // Minimum rating
        if (req.query.minRating) {
            query["rating.rate"] = { $gte: Number(req.query.minRating) };
        }

        // --- 3. EXECUTE QUERY with pagination ---
        const products = await Product.find(query)
            .skip(skip)
            .limit(limit);

        // --- 4. COUNT total matching docs for pagination info ---
        const totalProducts = await Product.countDocuments(query);
        const totalPages    = Math.ceil(totalProducts / limit);

        // --- 5. SEND RESPONSE ---
        res.json({
            products,
            currentPage:   page,
            totalPages,
            totalProducts,
            hasMore:       page < totalPages
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error" });
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