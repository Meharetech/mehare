const express = require('express');
const {
    submitQuery,
    getQueries,
    updateQueryStatus,
    deleteQuery
} = require('../controllers/query');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public route for submitting inquiries
router.post('/', submitQuery);

// Admin routes
router.get('/', protect, authorize('admin'), getQueries);

router.route('/:id')
    .put(protect, authorize('admin'), updateQueryStatus)
    .delete(protect, authorize('admin'), deleteQuery);

module.exports = router;
