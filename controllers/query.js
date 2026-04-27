const Query = require('../models/Query');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit a new contact query
// @route   POST /api/v1/queries
// @access  Public
exports.submitQuery = async (req, res, next) => {
    try {
        const { fullName, email, projectInterest, message } = req.body;

        const query = await Query.create({
            fullName,
            email,
            projectInterest,
            message
        });

        // Send confirmation email to user
        try {
            await sendEmail({
                email: email,
                subject: 'Inquiry Received - MehareTech',
                message: `Hi ${fullName},\n\nThank you for reaching out to MehareTech!\n\nWe have received your inquiry regarding "${projectInterest}". Our team of experts is currently reviewing your details and will get back to you within 24-48 hours to discuss the next steps.\n\nYour Message Summary:\n"${message}"\n\nBest Regards,\nThe MehareTech Team`
            });
        } catch (mailErr) {
            console.error('Email sending failed:', mailErr);
            // Don't fail the request if email fails, but we've logged it
        }

        res.status(201).json({
            success: true,
            message: 'Inquiry submitted successfully. We will get back to you soon!',
            data: query
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all queries
// @route   GET /api/v1/queries
// @access  Private/Admin
exports.getQueries = async (req, res, next) => {
    try {
        let queryObj = {};

        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            queryObj = {
                $or: [
                    { fullName: searchRegex },
                    { email: searchRegex },
                    { message: searchRegex }
                ]
            };
        }

        const queries = await Query.find(queryObj).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: queries.length,
            data: queries
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update query status
// @route   PUT /api/v1/queries/:id
// @access  Private/Admin
exports.updateQueryStatus = async (req, res, next) => {
    try {
        let query = await Query.findById(req.params.id);

        if (!query) {
            return res.status(404).json({ success: false, message: 'Query not found' });
        }

        query = await Query.findByIdAndUpdate(req.params.id, { status: req.body.status }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: query
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a query
// @route   DELETE /api/v1/queries/:id
// @access  Private/Admin
exports.deleteQuery = async (req, res, next) => {
    try {
        const query = await Query.findById(req.params.id);

        if (!query) {
            return res.status(404).json({ success: false, message: 'Query not found' });
        }

        await query.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Query deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};
