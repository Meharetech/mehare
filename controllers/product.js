const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('category_id', 'name').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single product
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new product
// @route   POST /api/v1/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
    try {
        // Add user to req.body
        if (req.user) {
            req.body.created_by = req.user.id;
        }

        // Handle file uploads if present
        if (req.files) {
            if (req.files.thumbnail_image && req.files.thumbnail_image[0]) {
                req.body.thumbnail_image = `/uploads/products/thumbnails/${req.files.thumbnail_image[0].filename}`;
            }
            if (req.files.gallery_images) {
                req.body.gallery_images = req.files.gallery_images.map(file => `/uploads/products/gallery/${file.filename}`);
            }
            if (req.files.main_file && req.files.main_file[0]) {
                req.body.main_file_url = `/uploads/products/files/${req.files.main_file[0].filename}`;
            }
        }

        // Parse JSON strings back to objects/arrays for FormData submissions
        const jsonFields = ['tags', 'meta_keywords', 'features', 'what_is_included', 'faq', 'gallery_images'];
        jsonFields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                try {
                    req.body[field] = JSON.parse(req.body[field]);
                } catch (e) {
                    console.error(`Error parsing JSON field ${field}:`, e);
                    // Leave it as is or set to empty array if meaningful
                }
            }
        });

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                error: 'Duplicate field value entered (Slug already exists)'
            });
        }
        next(err);
    }
};

// @desc    Update product
// @route   PUT /api/v1/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        // Add updater info
        if (req.user) {
            req.body.updated_by = req.user.id;
        }

        // Handle file uploads if present
        if (req.files) {
            if (req.files.thumbnail_image && req.files.thumbnail_image[0]) {
                req.body.thumbnail_image = `/uploads/products/thumbnails/${req.files.thumbnail_image[0].filename}`;
            }

            // Handle gallery images merging
            let galleryImages = [];
            if (req.body.existing_gallery_images) {
                try {
                    galleryImages = JSON.parse(req.body.existing_gallery_images);
                    // Standardize paths - remove the full URL if present
                    galleryImages = galleryImages.map(img => {
                        if (typeof img === 'string') {
                            return img.replace(/^https?:\/\/[^\/]+/, '');
                        }
                        return img;
                    });
                } catch (e) { }
            }

            if (req.files.gallery_images) {
                const newGallery = req.files.gallery_images.map(file => `/uploads/products/gallery/${file.filename}`);
                galleryImages = [...galleryImages, ...newGallery];
            }

            if (galleryImages.length > 0 || req.files.gallery_images) {
                req.body.gallery_images = galleryImages;
            }

            if (req.files.main_file && req.files.main_file[0]) {
                req.body.main_file_url = `/uploads/products/files/${req.files.main_file[0].filename}`;
            }
        } else if (req.body.existing_gallery_images) {
            // Case where only existing images are kept/modified
            try {
                let images = JSON.parse(req.body.existing_gallery_images);
                req.body.gallery_images = images.map(img => {
                    if (typeof img === 'string') {
                        return img.replace(/^https?:\/\/[^\/]+/, '');
                    }
                    return img;
                });
            } catch (e) { }
        }

        // Parse JSON strings back to objects/arrays for FormData submissions
        const jsonFields = ['tags', 'meta_keywords', 'features', 'what_is_included', 'faq'];
        jsonFields.forEach(field => {
            if (req.body[field] && typeof req.body[field] === 'string') {
                try {
                    req.body[field] = JSON.parse(req.body[field]);
                } catch (e) {
                    // console.error(`Error parsing JSON field ${field}:`, e);
                }
            }
        });

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};
