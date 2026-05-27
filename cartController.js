const Cart = require("../models/Cart");
const Product = require("../models/Product");

async function getCart(req, res) {
    try {
        const cart = await Cart.findOne({
            userId: req.user.userId
        });
        res.json(cart || { items: [] });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}


async function addToCart(req, res) {
    const { productId, qty } = req.body;
    const userId = req.user.userId;
    try {

        if (!qty || qty <= 0) {
            return res.status(400).json({
                message: "Invalid quantity"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }


        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = await Cart.create({
                userId,
                items: []
            });
        }
        const existing = cart.items.find(
            item =>
                item.productId?.toString() ===
                productId?.toString()
        );
        const totalQty = existing ? existing.qty + qty : qty;

        if (totalQty > product.stock) {
            return res.status(400).json({
                message: `only ${product.stock} items available`
            });
        }


        if (existing) {
            existing.qty += qty;
        } else {
            cart.items.push({
                productId,
                qty
            });
        }
            
        await cart.save();
        res.json({
            message: "Cart updated",
            cart
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}


async function updateCart(req, res) {
    const { productId, qty } = req.body;
    try {
        const cart = await Cart.findOne({
            userId: req.user.userId
        });
        if (!cart) {
            return res.json({
                items: []
            });
        }
        const item = cart.items.find(
            item =>
                item.productId?.toString() ===
                productId?.toString()
        );
        if (item) {
            item.qty = qty;
        }
        await cart.save();
        res.json({
            message: "Cart updated",
            cart
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}


async function removeFromCart(req, res) {
    const { productId } = req.body;
    try {
        const cart = await Cart.findOne({
            userId: req.user.userId
        });
        if (!cart) {
            return res.json({
                items: []
            });
        }
        cart.items = cart.items.filter(
            item =>
                item.productId?.toString() !==
                productId?.toString()
        );
        await cart.save();
        res.json({
            message: "Item removed",
            cart
        });
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}



async function clearCart(req, res) {

    try {

        await Cart.findOneAndUpdate(
            {
                userId: req.user.userId
            },
            {
                items: []
            }
        );

        res.json({
            message: "Cart cleared"
        });

    } catch (err) {

        res.status(500).json({
            message: "Server error"
        });
    }
}



module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart
};