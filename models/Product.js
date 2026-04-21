const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    // 1. Basic Product Fields
    product_title: {
        type: String,
        required: [true, 'Please add a product title'],
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Please add a slug'],
        unique: true,
        lowercase: true
    },
    short_description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    full_description: {
        type: String
    },
    category_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: true
    },
    sub_category_id: String,
    product_type: {
        type: String,
        default: 'digital'
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    file_size: String,
    status: {
        type: String,
        enum: ['draft', 'published', 'archived', 'private'],
        default: 'draft'
    },
    featured: {
        type: Boolean,
        default: false
    },
    trending: {
        type: Boolean,
        default: false
    },

    // 2. Pricing & License Fields
    regular_price: {
        type: Number,
        required: [true, 'Please add a regular price']
    },
    sale_price: Number,
    discount_percentage: Number,
    license_type: {
        type: String,
        enum: ['single', 'extended', 'commercial', 'custom'],
        default: 'single'
    },
    license_duration: {
        type: String,
        default: 'lifetime'
    },
    subscription_type: {
        type: String,
        default: 'one-time'
    },
    coupon_allowed: {
        type: Boolean,
        default: true
    },
    tax_percentage: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'USD'
    },

    // 3. File & Download Fields
    main_file_url: String,
    preview_file_url: String,
    demo_url: String,
    documentation_url: String,
    download_limit: {
        type: Number,
        default: -1 // -1 for unlimited
    },
    download_expiry_days: {
        type: Number,
        default: -1
    },
    license_key_required: {
        type: Boolean,
        default: false
    },
    license_key_prefix: String,
    file_hosting_type: {
        type: String,
        default: 'local'
    },

    // 4. SEO Fields
    meta_title: String,
    meta_description: String,
    meta_keywords: [String],
    focus_keyword: String,
    seo_slug: String,
    canonical_url: String,
    og_title: String,
    og_description: String,
    og_image: String,
    twitter_title: String,
    twitter_description: String,
    twitter_image: String,
    schema_type: {
        type: String,
        default: 'Product'
    },
    schema_json: String,
    robots_meta: {
        type: String,
        default: 'index, follow'
    },

    // 5. Image Fields
    thumbnail_image: String,
    gallery_images: [String],
    alt_text: String,
    image_title: String,
    image_caption: String,

    // 6. Product Feature Fields
    features: [String],
    what_is_included: [String],
    technical_requirements: String,
    installation_guide: String,
    support_period: String,
    support_details: String,
    compatibility: String,
    browser_support: [String],

    // 7. Marketing & Trust Fields
    rating: {
        type: Number,
        default: 5
    },
    review_count: {
        type: Number,
        default: 0
    },
    total_sales: {
        type: Number,
        default: 0
    },
    views_count: {
        type: Number,
        default: 0
    },
    wishlist_count: {
        type: Number,
        default: 0
    },
    money_back_guarantee: String,
    faq: [{
        question: String,
        answer: String
    }],
    tags: [String],
    badge_text: String,

    // 8. Inventory / Control Fields
    stock_status: {
        type: String,
        enum: ['instock', 'outofstock', 'preorder'],
        default: 'instock'
    },
    stock_quantity: {
        type: Number,
        default: 999
    },
    max_purchase_limit: Number,
    min_purchase_limit: {
        type: Number,
        default: 1
    },
    visibility: {
        type: String,
        enum: ['public', 'private', 'hidden'],
        default: 'public'
    },
    publish_date: Date,
    expire_date: Date,
    created_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    updated_by: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true // This covers created_at and updated_at
});

// Create slug from title if not provided
ProductSchema.pre('save', function () {
    if (!this.slug && this.product_title) {
        this.slug = this.product_title
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
});

module.exports = mongoose.model('Product', ProductSchema);
