const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const fullReset = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        // Delete any existing admin with this email to be sure
        await User.deleteMany({ email: 'admin@meharetech.com' });
        console.log('Old admin records cleared');

        // Create fresh admin
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@meharetech.com',
            password: 'admin123',
            role: 'admin',
            isVerified: true
        });

        console.log('New Admin created:');
        console.log('ID:', admin._id);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Verified:', admin.isVerified);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fullReset();
