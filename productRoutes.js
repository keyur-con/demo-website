const express = require("express");

const router = express.Router();

const checkAuth = require("../middleware/checkAuth");

const {
    getProducts,
    createProduct,
    deleteProduct
} = require("../controllers/productController");

router.get("/", getProducts);

router.post("/", checkAuth, createProduct);

router.delete("/:id", checkAuth, deleteProduct);

module.exports = router;