const express = require('express');
const router = express.Router();
const { Civilian, User } = require('../models/usersModel');
const { Item, Category, Data } = require('../models/dataModel');

// Reverse geocoding function to get address from lat/lng
const reverseGeocodeNominatim = async (lat, lng) => {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    
    try {
        // Use node-fetch to make the API call
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'YourAppNameHere/1.0' // Customize the User-Agent string
            }
        });
        const data = await response.json();

        if (data && data.address) {
            // Extract address details from the response
            const { road, house_number, city, postcode, country } = data.address;

            // Return available fields or default to null
            return {
                street: road || null,
                number: house_number || null,
                city: city || null,
                zip: postcode || null,
                country: country || null
            };
        } else {
            throw new Error('No valid address found');
        }
    } catch (error) {
        console.error('Error in Nominatim reverse geocoding:', error.message);
        return {
            street: null,
            number: null,
            city: null,
            zip: null,
            country: null
        }; // Return null for all fields if geocoding fails
    }
};


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

router.post('/updateLocation', async (req, res) => {
    let { lat, lng } = req.body;
    
    // Convert lat and lng to numbers
    lat = parseFloat(lat);
    lng = parseFloat(lng);
    


    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ message: 'Invalid latitude or longitude' });
    }

    try {
        // Find the user based on their session
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log('Updating location to:', { lat, lng }, 'for user:', user.username);
        
        const newAddress = await reverseGeocodeNominatim(lat, lng);
            
        
        // Update user's location and address
        user.location.coordinates = [lat, lng]; 
        user.address = newAddress;
        

        // Save the updated user
        await user.save();

        res.status(200).json({
            message: 'Location and address updated successfully',
            location: user.location,
            address: user.address
        });

    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: 'Error updating location', error });
    }
});

module.exports = router;