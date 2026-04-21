const express = require('express');
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/product');

const { protect, authorize } = require('../middleware/auth');
const { uploadProductFiles } = require('../middleware/upload');

const router = express.Router();

router
    .route('/')
    .get(getProducts)
    .post(protect, authorize('admin'), uploadProductFiles, createProduct);

router
    .route('/:id')
    .get(getProduct)
    .put(protect, authorize('admin'), uploadProductFiles, updateProduct)
    .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;
