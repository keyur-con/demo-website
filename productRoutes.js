const express = require("express");

const router = express.Router();

const checkAuth = require("../middleware/checkAuth");

const {
    getProducts,
    createProduct,
    deleteProduct,
    toggleStock,
    updateStock,
    getAdminProducts,
    restoreProduct,
    updateProductStatus
} = require("../controllers/productController");



router.get("/", getProducts);



router.get("/admin/all", checkAuth, getAdminProducts);



router.post("/", checkAuth, createProduct);


router.delete("/:id", checkAuth, deleteProduct);



router.patch("/:id/stock", checkAuth, toggleStock);


router.patch("/:id/quantity", checkAuth, updateStock);


router.get("/admin/all", checkAuth, getAdminProducts);


router.patch("/:id/restore", checkAuth, restoreProduct);


router.patch("/:id/status", checkAuth, updateProductStatus);


module.exports = router;