const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const otpGenerator = require('otp-generator');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, phone, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });

        // Create user (unverified) - password will be hashed by pre-save hook
        user = await User.create({
            name,
            email,
            phone,
            password,
            role,
            otp,
            otpExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
            isVerified: false
        });

        // Send OTP via email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Verification OTP',
                message: `Your verification code is: ${otp}. It expires in 10 minutes.`,
            });

            res.status(201).json({
                success: true,
                message: 'OTP sent to email. Please verify.',
            });
        } catch (err) {
            console.error(err);
            // Delete the user if email fails
            await User.findByIdAndDelete(user._id);
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Resend OTP
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find unverified user
        const user = await User.findOne({ email, isVerified: false });

        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found or already verified' });
        }

        // Generate new OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });

        // Update OTP and expiry
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP via email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Email Verification OTP - Resend',
                message: `Your new verification code is: ${otp}. It expires in 10 minutes.`,
            });

            res.status(200).json({
                success: true,
                message: 'New OTP sent to email.',
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (err) {
        next(err);
    }
};


// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({
            email,
            otp,
            otpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Mark as verified and clear OTP fields
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        console.log(`Login attempt for: ${email}`);

        if (!user) {
            console.log('User not found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        console.log(`Password match: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if verified
        console.log(`User Verification Status: ${user.isVerified}`);
        if (!user.isVerified) {
            console.log('Login failed: User not verified');
            return res.status(401).json({ success: false, message: 'Please verify your email first' });
        }

        console.log('Login successful, sending token...');
        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.error('Login Error:', err);
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {};

        // Only update fields that are provided
        if (req.body.name) fieldsToUpdate.name = req.body.name;
        if (req.body.email) fieldsToUpdate.email = req.body.email;
        if (req.body.phone !== undefined) fieldsToUpdate.phone = req.body.phone;
        if (req.body.location !== undefined) fieldsToUpdate.location = req.body.location;

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            returnDocument: 'after',
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        if (!(await user.matchPassword(req.body.currentPassword))) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = req.body.newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found with that email' });
        }

        // Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });

        // Set OTP and expiry
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset OTP',
                message: `Your password reset code is: ${otp}. It expires in 10 minutes.`,
            });

            res.status(200).json({
                success: true,
                message: 'OTP sent to email',
            });
        } catch (err) {
            console.error(err);
            user.otp = undefined;
            user.otpExpire = undefined;
            await user.save();
            return res.status(500).json({ success: false, message: 'Email could not be sent' });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Reset Password using OTP
// @route   PUT /api/v1/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({
            email,
            otp,
            otpExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Set new password
        user.password = newPassword;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    try {
        // Create token
        const token = user.getSignedJwtToken();

        const options = {
            expires: new Date(
                Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
        };

        if (process.env.NODE_ENV === 'production') {
            options.secure = true;
        }

        res.status(statusCode).cookie('token', token, options).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Token creation failed' });
    }
};
