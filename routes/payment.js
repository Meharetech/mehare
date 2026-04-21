const express = require('express');
const { createOrder, verifyPayment, getMyOrders, downloadFile } = require('../controllers/payment');
const { protect } = require('../middleware/auth');

console.log('Payment Router Initialized');
const router = express.Router();

router.get('/my-orders', protect, getMyOrders);
router.get('/download/:orderId', protect, downloadFile);
router.post('/order/:productId', protect, createOrder);
router.post('/verify', protect, verifyPayment);

router.use((req, res) => {
    console.log(`Payment Router 404: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found in Payment Router` });
});

module.exports = router;
