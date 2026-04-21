const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product type name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    slug: String,
    description: {
        type: String,
        maxlength: [500, 'Description can not be more than 500 characters']
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
});

// Create slug from the name
ProductTypeSchema.pre('save', async function () {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true });
    }
});

module.exports = mongoose.model('ProductType', ProductTypeSchema);
