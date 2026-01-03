const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

const seedAdmin = async () => {
    try {
        await User.deleteMany({ email: 'admin@example.com' });

        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: '123456', // Pre-save hook will hash it
            role: 'admin',
            isAdmin: true
        });

        console.log('Admin user created:', adminUser.email);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

seedAdmin();
