const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get dashboard stats
// @route   GET /api/v1/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Count completed orders
        const completedOrders = await Order.countDocuments({ user: userId, status: 'completed' });

        // Calculate total spent
        const totalSpent = await Order.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Count pending orders
        const pendingOrders = await Order.countDocuments({ user: userId, status: 'pending' });

        const stats = [
            { label: 'Completed Orders', value: completedOrders.toString(), change: '0%', color: 'from-blue-500 to-cyan-500', type: 'orders' },
            { label: 'Total Spent', value: `₹${(totalSpent[0]?.total || 0).toLocaleString()}`, change: '0%', color: 'from-green-500 to-emerald-500', type: 'revenue' },
            { label: 'Pending Payments', value: pendingOrders.toString(), change: '0%', color: 'from-orange-500 to-red-500', type: 'pending' },
            { label: 'Account Level', value: req.user.role === 'admin' ? 'Admin' : 'Member', change: 'Lifetime', color: 'from-purple-500 to-pink-500', type: 'active' },
        ];

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get recent activity
// @route   GET /api/v1/dashboard/activity
// @access  Private
exports.getActivity = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Fetch 5 most recent orders
        const orders = await Order.find({ user: userId })
            .populate('product', 'product_title')
            .sort('-createdAt')
            .limit(5);

        const activity = orders.map(order => ({
            id: order._id,
            type: order.status === 'completed' ? 'payment_success' : 'order_status',
            message: order.status === 'completed'
                ? `Successfully purchased ${order.product?.product_title || 'a product'}`
                : `Order for ${order.product?.product_title || 'a product'} is ${order.status}`,
            time: new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        // Add account creation as activity if needed
        if (activity.length === 0) {
            activity.push({
                id: 'welcome',
                type: 'system',
                message: 'Welcome to MehareTech dashboard!',
                time: 'Just now'
            });
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (err) {
        next(err);
    }
};
