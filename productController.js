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

module.exports = {
    getProducts
};