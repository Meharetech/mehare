const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        let admin = await User.findOne({ email: 'admin@meharetech.com' });

        if (admin) {
            admin.password = 'admin123';
            await admin.save();
            console.log('Admin password updated to: admin123');
        } else {
            await User.create({
                name: 'Main Admin',
                email: 'admin@meharetech.com',
                password: 'admin123',
                role: 'admin',
                isVerified: true
            });
            console.log('Admin user created with password: admin123');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateAdmin();
