const express = require("express");

const router = express.Router();

const checkAuth = require("../middleware/checkAuth");

const {
    checkout,
    getAllOrders,
    getMyOrders
} = require("../controllers/orderController");



router.post("/checkout", checkAuth, checkout);

router.get("/", checkAuth, getAllOrders);

router.get("/my", checkAuth, getMyOrders);



module.exports = router;