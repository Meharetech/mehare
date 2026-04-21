const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB:', process.env.MONGO_URI);

        let admin = await User.findOne({ email: 'admin@meharetech.com' });

        if (admin) {
            console.log('Found existing admin. Updating password...');
            admin.password = 'admin123';
            admin.role = 'admin';
            admin.isVerified = true;
            await admin.save();
            console.log('Admin password updated successfully.');
        } else {
            console.log('Admin not found. Creating new admin...');
            admin = await User.create({
                name: 'Main Admin',
                email: 'admin@meharetech.com',
                password: 'admin123',
                role: 'admin',
                isVerified: true
            });
            console.log('Admin user created successfully.');
        }

        // Verify immediately
        const testUser = await User.findOne({ email: 'admin@meharetech.com' }).select('+password');
        const isMatch = await testUser.matchPassword('admin123');
        console.log('Final Verification - Password Match:', isMatch);
        console.log('Final Verification - Role:', testUser.role);
        console.log('Final Verification - Verified:', testUser.isVerified);

        process.exit(0);
    } catch (err) {
        console.error('Error fixing admin:', err);
        process.exit(1);
    }
};

fixAdmin();
