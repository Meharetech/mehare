const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Create Razorpay order
// @route   POST /api/v1/payments/order/:productId
// @access  Private
exports.createOrder = asyncHandler(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);

    if (!product) {
        return next(new ErrorResponse(`Product not found with id of ${req.params.productId}`, 404));
    }

    const amount = (product.sale_price || product.regular_price) * 100; // Amount in paise

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return next(new ErrorResponse('Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.', 500));
    }

    const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
        amount: amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await instance.orders.create(options);

    if (!razorpayOrder) {
        return next(new ErrorResponse('Error creating Razorpay order', 500));
    }

    // Create order in our database
    await Order.create({
        user: req.user.id,
        product: product._id,
        amount: amount / 100,
        currency: "INR",
        razorpay_order_id: razorpayOrder.id,
        status: 'pending'
    });

    res.status(200).json({
        success: true,
        order: razorpayOrder
    });
});

// @desc    Verify Razorpay payment
// @route   POST /api/v1/payments/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // Update order status in database
        const order = await Order.findOneAndUpdate(
            { razorpay_order_id: razorpay_order_id },
            {
                razorpay_payment_id,
                razorpay_signature,
                status: 'completed'
            },
            { new: true }
        );

        // Increment total sales of the product
        await Product.findByIdAndUpdate(order.product, {
            $inc: { total_sales: 1 }
        });

        res.status(200).json({
            success: true,
            message: "Payment verified successfully"
        });
    } else {
        await Order.findOneAndUpdate(
            { razorpay_order_id: razorpay_order_id },
            { status: 'failed' }
        );
        return next(new ErrorResponse('Payment verification failed', 400));
    }
});

// @desc    Get current user's orders
// @route   GET /api/v1/payments/my-orders
// @access  Private
exports.getMyOrders = asyncHandler(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
        .populate({
            path: 'product',
            select: 'product_title thumbnail_image main_file_url sale_price regular_price'
        })
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        count: orders.length,
        data: orders
    });
});

// @desc    Download product file
// @route   GET /api/v1/payments/download/:orderId
// @access  Private
exports.downloadFile = asyncHandler(async (req, res, next) => {
    const order = await Order.findById(req.params.orderId).populate('product');

    if (!order) {
        return next(new ErrorResponse('Order not found', 404));
    }

    // Check if order belongs to user and is completed
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse('Not authorized to download this file', 401));
    }

    if (order.status !== 'completed') {
        return next(new ErrorResponse('Payment not completed for this order', 400));
    }

    const product = order.product;
    if (!product || !product.main_file_url) {
        return next(new ErrorResponse('File not found for this product', 404));
    }

    // Send file for download
    const path = require('path');
    const fs = require('fs');

    // Construct local path (assuming main_file_url starts with /uploads)
    const filePath = path.join(__dirname, '..', product.main_file_url);

    if (!fs.existsSync(filePath)) {
        return next(new ErrorResponse('Physical file not found on server', 404));
    }

    res.download(filePath, path.basename(filePath));
});
