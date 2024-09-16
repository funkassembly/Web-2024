const express = require('express');
const router = express.Router();
const User = require('../models/usersModel'); 

// POST request to create a new rescuer user
router.post('/create', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Received POST request with data:', req.body);
    // Check if all required fields are provided
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please provide username, email, and password' });
    }

    try {
        // Create the rescuer user with default role set to 'rescuer'
        const newUser = new User({
            username,
            email,
            password,  // The password will be hashed automatically due to the pre-save hook
            role: 'rescuer' // Default role
        });

        // Save the user to the database
        await newUser.save();

        // Return the created user, excluding the password for security
        res.status(201).json({
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            // Handle duplicate key error (e.g., username or email already exists)
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

module.exports = router;
