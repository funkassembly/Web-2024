const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/users_model');

const createCivilian = async (username, email, password) => {
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log('User with this username or email already exists');
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const civilianUser = new User({
            username,
            email,
            password: hashedPassword,
            role: 'civilian',
        });

        await civilianUser.save();
        console.log('Civilian user created successfully');
    } catch (err) {
        console.error('Error creating civilian user:', err);
    }
};

module.exports = { createCivilian };
