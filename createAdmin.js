
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/users_model');


mongoose.connect('mongodb://0.0.0.0:27017/web', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useCreateIndex: true,
})
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

const createAdmin = async () => {
    const username = 'admin'; 
    const email = 'theadmin@gmail.com'; 
    const password = 'Oadmin12#'; 

    try {
        // Check if an admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash(password, 12);
        const adminUser = new User({
            username,
            email,
            password: hashedPassword,
            role: 'admin',
        });

        await adminUser.save();
        console.log('Admin user created successfully');
    } catch (err) {
        console.error('Error creating admin user:', err);
    } finally {
        mongoose.connection.close(); 
    }
};


createAdmin();
