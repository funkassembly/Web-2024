const express = require('express');
const router = express.Router();
const { Civilian, User } = require('../models/usersModel');
const { Item, Category, Data } = require('../models/dataModel');

router.get('/location', async (req, res) => {
    try {
        // Ensure the user ID is available in the session
        const userId = req.session.userId; // Fetch userId from session

        if (!userId) {
            return res.status(401).json({ message: 'User not logged in' });
        }

        // Find the user by ID (it could be a civilian, rescuer, or any role stored in User collection)
        const civilian = await User.findById(userId).select('location');

        if (!civilian) {
            return res.status(404).json({ message: 'Civilian not found' });
        }

        // Assuming the location is stored as GeoJSON (lng, lat format)
        res.status(200).json({
            location: civilian.location
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching civilian location', error });
    }
});


module.exports = router;