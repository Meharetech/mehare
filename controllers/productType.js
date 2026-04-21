const ProductType = require('../models/ProductType');

// @desc    Get all product types
// @route   GET /api/v1/product-types
// @access  Public
exports.getProductTypes = async (req, res, next) => {
    try {
        const types = await ProductType.find();
        res.status(200).json({
            success: true,
            count: types.length,
            data: types
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single product type
// @route   GET /api/v1/product-types/:id
// @access  Public
exports.getProductType = async (req, res, next) => {
    try {
        const type = await ProductType.findById(req.params.id);
        if (!type) {
            return res.status(404).json({ success: false, error: 'Product type not found' });
        }
        res.status(200).json({ success: true, data: type });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new product type
// @route   POST /api/v1/product-types
// @access  Private/Admin
exports.createProductType = async (req, res, next) => {
    try {
        const type = await ProductType.create(req.body);
        res.status(201).json({ success: true, data: type });
    } catch (err) {
        next(err);
    }
};

// @desc    Update product type
// @route   PUT /api/v1/product-types/:id
// @access  Private/Admin
exports.updateProductType = async (req, res, next) => {
    try {
        const type = await ProductType.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!type) {
            return res.status(404).json({ success: false, error: 'Product type not found' });
        }
        res.status(200).json({ success: true, data: type });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete product type
// @route   DELETE /api/v1/product-types/:id
// @access  Private/Admin
exports.deleteProductType = async (req, res, next) => {
    try {
        const type = await ProductType.findById(req.params.id);
        if (!type) {
            return res.status(404).json({ success: false, error: 'Product type not found' });
        }
        await type.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};
