const express = require('express');
const router = express.Router();
const { Civilian, User, Task, Admin, Rescuer} = require('../models/usersModel');
const { Item, Category, Data } = require('../models/dataModel');

// Reverse geocoding function to get address from lat/lng
const reverseGeocodeNominatim = async (lat, lng) => {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    console.log(`apiURl: ${apiUrl}`);
    
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

// Route to get the logged-in user's ID
router.get('/id', (req, res) => {
    // Check if the session contains a userId (civilianId)
    if (req.session && req.session.userId) {
        res.json({ civilianId: req.session.userId });
    } else {
        // If not authenticated, return 401 Unauthorized
        res.status(401).json({ message: 'Not authenticated' });
    }
});

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
        console.log(`address: ${newAddress}`);
        

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


// Route to get the civilian's address based on their userId in the session
router.get('/address', async (req, res) => {
    try {
        // Debugging: Log the session data
        console.log("Fetching address for the civilian...");

        // Get the userId from the session
        const userId = req.session.userId;
        

        if (!userId) {
            return res.status(400).json({ message: 'UserId is missing from the request.' });
        }

        // Find the civilian by userId (_id)
        const civilian = await Civilian.findById(userId).select('address');

        if (!civilian) {
            return res.status(404).json({ message: 'No civilian found for this userId' });
        }

        if (!civilian.address) {
            return res.status(404).json({ message: 'No address found for this civilian' });
        }

        res.json(civilian.address);
    } catch (error) {
        console.error('Error fetching civilian address:', error);
        res.status(500).json({ message: 'Failed to fetch address' });
    }
});


// Route to submit a new task (request or donation)
router.post('/tasks', async (req, res) => {
    try {
        const { type, status, address, item, itemCategory, quantity, rescuerUsername, dateServed } = req.body;

        // Assuming the user is logged in and we have their ID stored in the session
        const civilianId = req.session.userId;

        // Find the civilian
        const civilian = await Civilian.findById(civilianId);
        if (!civilian) {
            return res.status(404).json({ message: 'Civilian not found' });
        }

        // Create a new task object
        const newTask = {
            type,
            status,
            civilianId,
            address,
            item,
            itemCategory,
            quantity,
            rescuerUsername,
            dateServed
        };

        // Add the task to the civilian's tasks array
        civilian.tasks.push(newTask);

        // Save the civilian
        await civilian.save();

        res.status(200).json({ message: 'Task submitted successfully', task: newTask });
    } catch (error) {
        console.error('Error submitting task:', error);
        res.status(500).json({ message: 'Error submitting task' });
    }
});

// Assuming you have a tasks collection and a civilian model in your database
router.get('/loadtasks', async (req, res) => {
    try {
        const userId = req.session.userId; 
        console.log('Fetching tasks for civilian ID:', userId);
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const tasks = await Civilian.findById(userId).select('tasks');
        // Fetch tasks from the database by civilianId
        // const tasks = await Task.find({ civilianId: civilianId }); // Assuming a Task model
        console.log(`Tasks: ${tasks}`);
        if (tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found' });
        }

        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Error fetching tasks' });
    }
});



router.get('/announcements', async (req, res) => {
    try {
        // Find the admin and fetch only the announcements
        const admin = await Admin.findOne({ role: 'admin' }).select('announcements');

        if (!admin || !admin.announcements || admin.announcements.length === 0) {
            return res.status(404).json({ message: 'No announcements found' });
        }

        // Flatten the announcements array to remove the unnecessary nested arrays
        const flattenedAnnouncements = admin.announcements.flat();

        console.log(`/nFlattened Announcements:`, flattenedAnnouncements);

        // Send the flattened announcements
        res.json(flattenedAnnouncements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Error fetching announcements' });
    }
});




// Fetch all civilians with their tasks
router.get('/all', async (req, res) => {
    try {
        const civilians = await Civilian.find()
            .populate('tasks.rescuerUsername') // Populate rescuer's username
            .select('-password'); // Exclude password field
        const formattedCivilians = civilians.map(civilian => ({
            _id: civilian._id,
            username: civilian.username,
            name: civilian.name,
            surname: civilian.surname,
            cellphone: civilian.cellphone,
            location: civilian.location, // Ensure this has coordinates
            tasks: civilian.tasks.map(task => ({
                type: task.type,
                status: task.status,
                item: task.item,
                quantity: task.quantity,
                dateSubmitted: task.dateSubmitted,
                rescuerUsername: task.rescuerUsername ? task.rescuerUsername.username : null, // Get rescuer's username
                dateServed: task.dateServed
            }))
        }));
        res.status(200).json({
            success: true,
            civilians: formattedCivilians
        });
    } catch (error) {
        console.error('Error fetching civilians:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;