const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email address'],
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    projectInterest: {
        type: String,
        required: [true, 'Please select your project interest'],
        enum: ['Website Development', 'Android Development', 'Custom Software', 'SEO', 'Digital Marketing', 'Other']
    },
    message: {
        type: String,
        required: [true, 'Please provide message details'],
        trim: true
    },
    status: {
        type: String,
        enum: ['New', 'In Progress', 'Resolved', 'Spam'],
        default: 'New'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Query', querySchema);
