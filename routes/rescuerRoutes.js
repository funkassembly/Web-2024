const express = require('express');
const router = express.Router();
const { Rescuer, User } = require('../models/usersModel');
const { Item, Category, Data } = require('../models/dataModel');


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

// Get Current Rescuer's Cargo 
router.get('/getCargo', async (req, res) => {
    console.log('getCargo route hit');  // Debugging line
    try {
        const userId = req.session.userId;
        const user = await Rescuer.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        console.log('Returning user cargo:', user.cargo);
        res.json({ success: true, cargo: user.cargo });
    } catch (error) {
        console.error('Error fetching cargo:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


// Route to save cargo to the database
router.post('/saveCargo', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cargo } = req.body;

        // Find the rescuer and update their cargo
        const user = await Rescuer.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch the data document that contains all the items and categories
        const dataDoc = await Data.findOne();
        if (!dataDoc) {
            return res.status(500).json({ success: false, message: 'Data document not found' });
        }

        // Iterate over the cargo and update items and categories
        for (const obj of cargo) {
            console.log(`Processing cargo item: ${JSON.stringify(obj)}`);

            // Find the item by its id within the items array
            const item = dataDoc.items.find(i => i.id === obj.itemId);
            if (!item) {
                return res.status(400).json({ success: false, message: 'Invalid item ID' });
            }

            // Find the category by its name within the categories array
            const itemCategory = dataDoc.categories.find(c => c.category_name === obj.categoryName);
            if (!itemCategory) {
                return res.status(400).json({ success: false, message: 'Invalid category name' });
            }

            // Check stock availability
            if (item.stock < obj.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for product: ${item.name}` });
            }

            // Deduct the stock for the item
            item.stock -= obj.quantity;

            // Update Rescuer's Cargo
            console.log(`item: ${item}, itemCategory: ${itemCategory}, quantity: ${obj.quantity}`);
            const existingCargoItem = user.cargo.find(cargoItem => cargoItem.item === item.name);
            if (existingCargoItem) {
                // If product already exists in cargo, just update the quantity
                existingCargoItem.quantity += obj.quantity;
            } else {
                // If product is not in cargo, add it as a new item
                user.cargo.push({
                    item: item.name,  // Save item name as string
                    itemCategory: itemCategory.category_name,  // Save category name as string
                    quantity: obj.quantity
                });
            }
        }
        
        // Save the updated rescuer data
        await user.save();

        // Save the updated stock back to the data document
        await dataDoc.save();

        res.json({ success: true, message: 'Cargo saved successfully' });
    } catch (error) {
        console.error('Error saving cargo:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


router.post('/unloadCargo', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { items } = req.body;  // Array of items with itemName and quantity

        // Find the rescuer
        const user = await Rescuer.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }

        // Fetch the data document that contains all the items
        const dataDoc = await Data.findOne();
        if (!dataDoc) {
            return res.status(500).json({ success: false, message: 'Data document not found' });
        }

        // Iterate through the items to be unloaded
        for (const item of items) {
            const { itemName, quantity } = item;
            
            // Find the item in the general items collection by its name
            const itemInStorage = dataDoc.items.find(i => i.name === itemName);
            if (!itemInStorage) {
                return res.status(400).json({ success: false, message: `Item ${itemName} not found in storage` });
            }

            // Find the item in the rescuer's cargo
            const cargoItemIndex = user.cargo.findIndex(cargoItem => cargoItem.item === itemName);

            if (cargoItemIndex === -1) {
                return res.status(400).json({ success: false, message: `Item ${itemName} not found in rescuer's cargo` });
            }

            const cargoItem = user.cargo[cargoItemIndex];

            // Ensure enough quantity exists to unload
            if (cargoItem.quantity < quantity) {
                return res.status(400).json({ success: false, message: `Not enough quantity of ${itemName} in cargo to unload` });
            }

            // Update the stock in the general storage
            itemInStorage.stock += quantity;  // Add the unloaded quantity back to the stock

            // Deduct the quantity from the rescuer's cargo
            cargoItem.quantity -= quantity;

            // If the quantity becomes zero, remove the item from the rescuer's cargo
            if (cargoItem.quantity === 0) {
                user.cargo.splice(cargoItemIndex, 1);  // Remove the item from cargo
            }
        }

        // Save the updated rescuer data
        await user.save();

        // Save the updated stock back to the data document
        await dataDoc.save();

        res.json({ success: true, message: 'Cargo unloaded successfully, and stock updated.' });
    } catch (error) {
        console.error('Error unloading cargo:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


// Route to fetch all civilians' locations
router.get('/civInfo', async (req, res) => {
    try {
        // Find all users with the role 'civilian' and return their locations and usernames
        const civilians = await User.find({ role: 'civilian' }, 'location name cellphone address tasks');

        if (!civilians || civilians.length === 0) {
            return res.status(404).json({ message: 'No civilians found' });
        }

        res.json(civilians);  
    } catch (error) {
        console.error('Error fetching civilians locations:', error);
        res.status(500).json({ message: 'Error fetching civilians locations' });
    }
});

// Route for serving selected tasks
// Route to serve tasks and update them with rescuer details
router.post('/serveTasks', async (req, res) => {
    try {
        const rescuerId = req.session.userId; // Get rescuer ID from session
        const { civilianId, taskIds } = req.body; // Get civilian ID and task IDs from the request body
        console.log(`\ncivilianId: ${civilianId}\n, taskIds: ${taskIds}\n, rescuerId: ${rescuerId}`);

        const taskIdsArray = Array.isArray(taskIds) ? taskIds : [taskIds]; // Ensure taskIds is an array
        const currentDate = new Date(); // Get the current date when serving the tasks

        // Find the rescuer by ID
        const rescuer = await User.findById(rescuerId);

        if (!rescuer) {
            return res.status(404).json({ message: 'Rescuer not found' });
        }

        // Check how many tasks the rescuer currently has
        const rescuerTasksCount = rescuer.tasks.length;

        if (rescuerTasksCount >= 4) {
            return res.status(400).json({ message: 'You have already reached the limit of 4 tasks.' });
        }

        // Calculate how many more tasks can be added
        const remainingTaskSlots = 4 - rescuerTasksCount;

        if (taskIdsArray.length > remainingTaskSlots) {
            return res.status(400).json({ message: `You can only serve ${remainingTaskSlots} more task(s).` });
        }

        // Find the civilian by ID
        const civilian = await User.findById(civilianId);

        if (!civilian) {
            return res.status(404).json({ message: 'Civilian not found' });
        }

        // Loop through the civilian's tasks and update the matching ones
        civilian.tasks.forEach(task => {
            if (taskIdsArray.includes(task._id.toString())) { // Match tasks by _id
                task.rescuerUsername = rescuerId; // Update rescuer's ID
                task.dateServed = currentDate; // Update the served date
                task.status = 'processed'; // Update status to processed

                // Add the task to the rescuer's task list
                const taskCopy = {
                    ...task.toObject(), // Copy the task fields
                    rescuerUsername: rescuerId, // Make sure rescuerUsername is updated
                    dateServed: currentDate, // Ensure dateServed is current
                    status: 'processed' // Ensure status is 'processed'
                };

                rescuer.tasks.push(taskCopy); // Add to rescuer's tasks list
            }
        });

        // Save the updated civilian and rescuer documents
        await civilian.save();
        await rescuer.save();

        res.json({ success: true, message: 'Tasks served successfully and updated for both civilian and rescuer.' });
    } catch (error) {
        console.error('Error serving tasks:', error);
        res.status(500).json({ message: 'Error serving tasks' });
    }
});







module.exports = router;