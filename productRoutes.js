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
    updateProductStatus,
    getDeletedProducts
} = require("../controllers/productController");



router.get("/", getProducts);
router.get("/admin/all", checkAuth, getAdminProducts);
router.get("/deleted", checkAuth , getDeletedProducts);


router.post("/", checkAuth, createProduct);
router.delete("/:id", checkAuth, deleteProduct);

router.patch("/:id/stock", checkAuth, toggleStock);

router.patch("/:id/quantity", checkAuth, updateStock);

router.patch("/:id/status", checkAuth, updateProductStatus);
router.patch("/:id/restore", checkAuth, restoreProduct);

module.exports = router;