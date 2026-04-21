const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a category name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    slug: String,
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
    },
    icon: {
        type: String,
        default: 'Folder'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create category slug from the name
CategorySchema.pre('save', async function () {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true });
    }
});

// Cascade delete products when a category is deleted
CategorySchema.pre('deleteOne', { document: true, query: false }, async function () {
    console.log(`Products being removed from category ${this._id}`);
    await mongoose.model('Product').deleteMany({ category_id: this._id });
});

// Reverse populate with products
CategorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'category_id',
    justOne: false
});

module.exports = mongoose.model('Category', CategorySchema);
