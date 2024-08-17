

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/users_model');

const createRescuer = async (username, email, password) => {
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log('User with this username or email already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const rescuerUser = new User({
            username,
            email,
            password: hashedPassword,
            role: 'rescuer',
        });

        await rescuerUser.save();
        console.log('Rescuer user created successfully');
    } catch (err) {
        console.error('Error creating rescuer user:', err);
    }
};

module.exports = { createRescuer };
