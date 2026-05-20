const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String
    },
    image: {
        type: String
    },
    rating: {
        rate:  { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    },
    inStock: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: 10,    
        min: 0           
    },
    status: {
        type: String,
        enum: ["active", "out_of_stock", "unavailable"],
        default: "active"
    },
    isDeleted: {
        type: Boolean,
        default: false   
    }
    
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);