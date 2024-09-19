const express = require('express');
const router = express.Router();
const { Rescuer } = require('../models/usersModel');



// Fetch rescuer tasks
router.get('/tasks', async (req, res) => {
    try {
        const rescuer = await Rescuer.findById(req.session.userId).populate('tasks.item');
        res.json({ tasks: rescuer.tasks });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching tasks' });
    }
});


// Update Rescuer's Location
router.post('/updateRescuerLocation', async (req, res) => {
    let { lat, lng } = req.body;

    lat = parseFloat(lat);
    lng = parseFloat(lng);

    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ success: false, message: 'Invalid coordinates' });
    }

    try {
        const rescuer = await Rescuer.findById(req.session.userId);
        if (!rescuer) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }

        // Update location
        rescuer.location.coordinates = [lng, lat]; // lng, lat format in GeoJSON
        await rescuer.save();

        res.json({ success: true, message: 'Location updated successfully' });
    } catch (err) {
        console.error('Error updating location:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



// Fetch Rescuer Cargo
router.get('/rescuerCargo', async (req, res) => {
    try {
        const rescuer = await Rescuer.findById(req.session.userId).populate('cargo.item');
        if (!rescuer) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }

        res.json({ success: true, cargo: rescuer.cargo });
    } catch (err) {
        console.error('Error fetching cargo:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Load Cargo for Rescuer
router.post('/loadCargo', async (req, res) => {
    const { itemId, quantity } = req.body;

    try {
        const rescuer = await Rescuer.findById(req.session.userId);

        if (!rescuer) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }

        const itemIndex = rescuer.cargo.findIndex(c => c.item.equals(itemId));

        // If item already exists in cargo, update quantity
        if (itemIndex !== -1) {
            rescuer.cargo[itemIndex].quantity += quantity;
        } else {
            rescuer.cargo.push({ item: itemId, quantity });
        }

        await rescuer.save();

        res.json({ success: true, message: 'Cargo loaded successfully' });
    } catch (err) {
        console.error('Error loading cargo:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;