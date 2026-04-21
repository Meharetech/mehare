const express = require('express');
const { getStats, getActivity } = require('../controllers/dashboard');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, getStats);
router.get('/activity', protect, getActivity);

module.exports = router;
