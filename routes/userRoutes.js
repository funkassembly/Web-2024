const express = require('express');
const router = express.Router();
const { Admin } = require('../models/usersModel'); // Use Admin model
const { Rescuer } = require('../models/usersModel'); // Use Rescuer model


// POST request to create a new rescuer user
router.post('/create', async (req, res) => {
    const { username, email, password, cargo } = req.body;
    console.log('Received POST request with data:', req.body);

    // Check if all required fields are provided
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please provide username, email, and password' });
    }

    try {
        // Create the rescuer user using the Rescuer model
        const newRescuer = new Rescuer({
            username,
            email,
            password,  // The password will be hashed automatically due to the pre-save hook
            cargo,     // Optional cargo field
            tasks: []  // Initialize tasks as an empty array
        });

        // Save the rescuer to the database
        await newRescuer.save();

        // Return the created rescuer, excluding the password for security
        res.status(201).json({
            id: newRescuer._id,
            username: newRescuer.username,
            email: newRescuer.email,
            cargo: newRescuer.cargo,
            role: 'rescuer'
        });
    } catch (error) {
        console.error('Error creating rescuer:', error);
        if (error.code === 11000) {
            // Handle duplicate key error (e.g., username or email already exists)
            res.status(400).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

router.post('/create-announcement', async (req, res) => {
    try {
        const { date, announcement, items } = req.body;

        // Find the admin user by role (assuming there's one admin for simplicity)
        const adminUser = await Admin.findOne();

        if (!adminUser) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Add the new announcement to the admin's announcements array
        adminUser.announcements.push({
            date,
            announcement,
            items
        });

        // Save the admin user with the new announcement
        await adminUser.save();

        return res.status(200).json({ message: 'Announcement added successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error adding announcement' });
    }
});

module.exports = router;
