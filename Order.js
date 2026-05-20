const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId:      { type: String, required: true },
    userId:       { type: mongoose.Schema.Types.Mixed, required: true },
    userName:     { type: String },
    receiverName: { type: String, required: true },
    email:        { type: String, required: true },
    mobile:       { type: String, required: true },
    address:      { type: String, required: true },
    items: [
        {
            productId: mongoose.Schema.Types.ObjectId,
            title:     String,
            price:     Number,
            image:     String,
            qty:       Number,
            total:     Number
        }
    ],
    totalAmount:  { type: Number },
    discount:     { type: Number, default: 0 },
    finalAmount:  { type: Number },
    status: {
        type: String,
        default: "placed",
        enum: ["placed", "confirmed", "shipped", "delivered", "cancelled"]
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);