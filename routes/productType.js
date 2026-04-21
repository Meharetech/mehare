const express = require('express');
const {
    getProductTypes,
    getProductType,
    createProductType,
    updateProductType,
    deleteProductType
} = require('../controllers/productType');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(getProductTypes)
    .post(protect, authorize('admin'), createProductType);

router
    .route('/:id')
    .get(getProductType)
    .put(protect, authorize('admin'), updateProductType)
    .delete(protect, authorize('admin'), deleteProductType);

module.exports = router;
