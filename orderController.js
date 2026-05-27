
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const Cart = require("../models/Cart");

// async function checkout(req, res) {
//     const userId = req.user.userId;
//     const {
//         receiverName,
//         email,
//         mobile,
//         address,
//         items,
//         discount
//     } = req.body;

//     if (!receiverName || !email || !mobile || !address || !items ) {
//         return res.status(400).json({
//             success: false,
//             message: "All fields required"
//         });
//     }

//     try {
//         const products = await Product.find();
//         const orderItems = [];
//         let totalAmount = 0;

        
//         for (const item of items) {

//             const product = products.find(
//                 p => p._id.toString() === item.productId.toString()
//             );

            
//             if (!product) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Product no longer exists"
//                 });
//             }

            
//             if (
//                 product.status === "out_of_stock" ||
//                 product.status === "not_available"
//             ) {
//                 return res.status(400).json({
//                     success: false,
//                     message: `${product.title} is unavailable`
//                 });
//             }

            
//             if (item.qty > product.stock) {
//                 return res.status(400).json({
//                     success: false,
//                     message:
//                         `${product.title} only has ${product.stock} left in stock`
//                 });
//             }
//         }

//         items.forEach(item => {
//             const product = products.find(
//                 p =>
//                     p._id.toString() ===
//                     item.productId.toString()
//             );
//             if (!product) return;
//             const itemTotal = product.price * item.qty;
//             totalAmount += itemTotal;
//             orderItems.push({
//                 productId: product._id,
//                 title: product.title,
//                 price: product.price,
//                 image: product.image,
//                 qty: item.qty,
//                 total: itemTotal
//             });
//         });

//         const discountAmount = parseFloat(
//             ((totalAmount * discount) / 100).toFixed(2)
//         );

//         const finalAmount = parseFloat(
//             (totalAmount - discountAmount).toFixed(2)
//         );

//         const user = await User.findById(userId);

//         const newOrder = await Order.create({
//             orderId: "ORD-" + Date.now(),
//             userId,
//             userName: user?.username || "Unknown",
//             receiverName,
//             email,
//             mobile,
//             address,
//             items: orderItems,
//             totalAmount,
//             discount,
//             finalAmount,
//             status: "placed"
//         });
//         for (const item of orderItems) {

//             const product = await Product.findById(item.productId);

//             if (!product) {
//                 continue;
//             }

            
//             product.stock -= item.qty;

            
//             if (product.stock <= 0) {
//                 product.stock = 0;
//                 product.inStock = false;
//                 product.status = "out_of_stock";
//             }

//             await product.save();
//         }

//         await Cart.findOneAndUpdate(
//             { userId },
//             { items: [] }
//         );


//         res.status(201).json({
//             success: true,
//             order: newOrder
//         });

//     } catch (err) {
//         console.log(err);
//         res.status(500).json({
//             message: "Server error"
//         });
//     }
// }

async function checkout(req, res) {
    

    try {
        

        const userId = req.user.userId;

        const {
            receiverName,
            email,
            mobile,
            address,
            items,
            discount
        } = req.body;

        if (
            !receiverName ||
            !email ||
            !mobile ||
            !address ||
            !items ||
            items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields required"
            });
        }

        const orderItems = [];
        let totalAmount = 0;

        
        for (const item of items) {
            const product =
                await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        stock: { $gte: item.qty },
                        status: {
                            $nin: [
                                "out_of_stock",
                                "not_available"
                            ]
                        }
                    },
                    {
                        $inc: { stock: -item.qty }
                    },
                    {
                        returnDocument: "after"
                    }
                );

            if (!product) {
                throw new Error(
                    "Product unavailable or insufficient stock"
                );
            }

            
            if (product.stock <= 0) {
                product.stock = 0;
                product.inStock = false;
                product.status = "out_of_stock";
                await product.save();
            }

            const itemTotal =
                product.price * item.qty;

            totalAmount += itemTotal;

            orderItems.push({
                productId: product._id,
                title: product.title,
                price: product.price,
                image: product.image,
                qty: item.qty,
                total: itemTotal
            });
        }

        const discountAmount = parseFloat(
            ((totalAmount * discount) / 100).toFixed(2)
        );

        const finalAmount = parseFloat(
            (
                totalAmount - discountAmount
            ).toFixed(2)
        );

        const user =
            await User.findById(userId);

        const newOrder =
            await Order.create({
                    orderId:
                        "ORD-" + Date.now(),
                    userId,
                    userName:
                        user?.username ||
                        "Unknown",
                    receiverName,
                    email,
                    mobile,
                    address,
                    items: orderItems,
                    totalAmount,
                    discount,
                    finalAmount,
                    status: "placed"
                });

        
        await Cart.findOneAndUpdate(
            { userId },
            { items: [] },
            
        );


        res.status(201).json({
            success: true,
            order: newOrder
        });

    } catch (err) {
        

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
}

async function getAllOrders(req, res) {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            error: "Admins only"
        });
    }
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}

async function getMyOrders(req, res) {
    try {
        const orders = await Order.find({
            userId: req.user.userId
        }).sort({
            createdAt: -1
        });
        res.json(orders);
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
}

module.exports = {
    checkout,
    getAllOrders,
    getMyOrders
};