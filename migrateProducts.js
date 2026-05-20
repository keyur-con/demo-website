const mongoose = require("mongoose");
const fs = require("fs");

const Product = require("./models/Product");

async function migrateProducts() {

    try {

        
        await mongoose.connect("mongodb://127.0.0.1:27017/shopDB");

        console.log("MongoDB Connected");

        
        const productsData = JSON.parse(
            fs.readFileSync("./products.json", "utf-8")
        );

        
        await Product.deleteMany({});

        console.log("Old products removed");

        
        await Product.insertMany(productsData);

        console.log("Products Migrated Successfully");

        process.exit();

    } catch (err) {

        console.log("Migration Error:", err.message);
    }
}

migrateProducts();