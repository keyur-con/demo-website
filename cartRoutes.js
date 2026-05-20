const express = require("express");

const router = express.Router();

const checkAuth = require("../middleware/checkAuth");

const {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");



router.get("/", checkAuth, getCart);

router.post("/", checkAuth, addToCart);

router.put("/", checkAuth, updateCart);

router.delete("/", checkAuth, removeFromCart);

router.delete("/clear", checkAuth, clearCart);



module.exports = router;