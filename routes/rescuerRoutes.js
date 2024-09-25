const express = require('express');
const router = express.Router();
const { Rescuer, User, Civilian } = require('../models/usersModel');
const { Item, Category, Data } = require('../models/dataModel');

// Utility function to calculate haversine distance between two coordinates
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

router.get('/current', (req, res) => {
    const currentRescuerId = req.session.userId; // Assuming `req.user` contains the logged-in user's information
    if (currentRescuerId) {
        res.json({ success: true, rescuerId: currentRescuerId });
    } else {
        res.status(401).json({ success: false, message: 'Rescuer not found' });
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

// Route to get rescuer's tasks
router.get('/myTasks', async (req, res) => {
    try {
        const rescuerId = req.session.userId; // Assuming you're storing userId in the session
        const rescuer = await User.findById(rescuerId).populate({
            path: 'tasks.civilianId', // Populate the civilian information for each task
            select: 'name cellphone address' // Select the fields you want to include
        });
        

        if (!rescuer || !rescuer.tasks || rescuer.tasks.length === 0) {
            return res.status(404).json({ message: 'No tasks found' });
        }

        res.json({ tasks: rescuer.tasks });
    } catch (error) {
        console.error('Error fetching rescuer tasks:', error);
        res.status(500).json({ message: 'Error fetching rescuer tasks' });
    }
});

// Route to cancel tasks
router.post('/cancelTasks', async (req, res) => {
    const { taskIds } = req.body;
    const rescuerId = req.session.userId; // Get the rescuer's ID

    try {
        // Find the rescuer and update the tasks
        const rescuer = await Rescuer.findById(rescuerId);

        if (!rescuer) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }

        // Loop through the tasks and cancel them
        rescuer.tasks = rescuer.tasks.filter(task => !taskIds.includes(task._id.toString()));

        await rescuer.save();

        // For each task, find the corresponding civilian and update their task
        for (let taskId of taskIds) {
            // Find the civilian who has this task
            const civilian = await User.findOne({ 'tasks._id': taskId, role: 'civilian' });

            if (civilian) {
                // Find the task inside the civilian's tasks and update it
                civilian.tasks.forEach(task => {
                    if (task._id.toString() === taskId) {
                        task.status = 'pending';  // Set status to pending
                        task.rescuerUsername = null;  // Set rescuerUsername to 'n/a'
                        task.dateServed = null;  // Set dateServed to 'n/a'
                    }
                });

                // Save the updated civilian
                await civilian.save();
            }
        }


        res.json({ success: true, message: 'Tasks canceled and updated for the civilian.' });
    } catch (error) {
        console.error('Error canceling tasks:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Route to deliver tasks (this should already exist, just included for completeness)
router.post('/deliverTasks', async (req, res) => {
    const { taskIds } = req.body;
    const rescuerId = req.session.userId; // Get rescuer ID from session

    try {
        // Find the rescuer by ID
        const rescuer = await User.findById(rescuerId);

        if (!rescuer|| !rescuer.location || !rescuer.location.coordinates) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }
        // Get rescuer's location from the database
        const rescuerLocation = {
            lat: rescuer.location.coordinates[0], // lat
            lng: rescuer.location.coordinates[1]  // lng
        };
        console.log(rescuerLocation);
        // Placeholder for tasks within 50 meters
        const tasksWithinDistance = [];

        // Fetch civilians who have the tasks
        const civilians = await Civilian.find({
            'tasks._id': { $in: taskIds } // Find civilians who have the selected task IDs
        }, 'tasks location'); // Fetch their location and tasks only
        console.log(`\nCivilians found: ${civilians}\n`);
        

        if (!civilians || civilians.length === 0) {
            return res.status(404).json({ success: false, message: 'No civilians found for the selected tasks' });
        }
        

        // 3. Loop through civilians to get the tasks and their location
        civilians.forEach(civilian => {
            const civilianLat = civilian.location.coordinates[0]; // Latitude
            const civilianLng = civilian.location.coordinates[1]; // Longitude

            // Calculate the distance between the rescuer and the civilian
            const distance = haversineDistance(
                rescuerLocation.lat,
                rescuerLocation.lng,
                civilianLat,
                civilianLng
            );

            console.log(`Distance between rescuer and civilian: ${distance} meters`);

            // Check if the task is within 50 meters
            if (distance <= 50) {
                // Filter out the task IDs that match and are within distance
                civilian.tasks.forEach(task => {
                    if (taskIds.includes(task._id.toString())) {
                        tasksWithinDistance.push({
                            taskId: task._id,
                            civilianId: civilian._id
                        });
                    }
                });
            }
        });

        // 4. Process tasks that are within the distance
        if (tasksWithinDistance.length > 0) {
            console.log('Tasks within 50 meters:', tasksWithinDistance);

            for (const task of tasksWithinDistance) {
                const { taskId, civilianId } = task;

                // Find the civilian by ID and update the corresponding task
                const civilian = await User.findById(civilianId);
                console.log(`civilian: ${civilian}`);
                if (civilian) {
                    civilian.tasks.forEach(civilianTask => {
                        if (civilianTask._id.toString() === taskId.toString()) {
                            civilianTask.status = 'delivered';
                            civilianTask.dateServed = new Date(); // Set current date as the delivery date
                        }
                    });

                    // Save the updated civilian document
                    await civilian.save();

                    // Remove the task from the rescuer's task list
                    rescuer.tasks = rescuer.tasks.filter(rescuerTask => rescuerTask._id.toString() !== taskId.toString());
                }
            }

            // Save the updated rescuer document
            await rescuer.save();

            res.json({ success: true, message: 'Tasks successfully delivered and updated' });
        } else {
            console.log('No tasks within 50 meters');
            res.json({ success: true, message: 'No tasks within 50 meters' });
        }

    } catch (error) {
        console.error('Error delivering tasks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// // Route to get civilians with tasks assigned to the current rescuer
// router.get('/civilian-locations/:rescuerId', async (req, res) => {
//     const { rescuerId } = req.params;  // Get rescuer ID from the route parameter

//     try {
//         // 1. Find the rescuer's location
//         const rescuer = await User.findById(rescuerId, 'location');
//         if (!rescuer || !rescuer.location || !rescuer.location.coordinates) {
//             return res.status(404).json({ success: false, message: 'Rescuer location not found' });
//         }

//         // 2. Find civilians who have tasks assigned to this rescuer (tasks.rescuerUsername == rescuerId)
//         const civilians = await User.find({
//             role: 'civilian',  // Ensure we are only looking at civilians
//             'tasks.rescuerUsername': rescuerId,
//             'tasks.status': 'processed'  // Filter for processed tasks only
//         }, 'location tasks');  // Select location and tasks fields only

//         if (!civilians || civilians.length === 0) {
//             return res.status(404).json({ success: false, message: 'No civilians with tasks assigned to this rescuer' });
//         }

//         // 3. Filter tasks to ensure we are only looking at tasks for the current rescuer
//         const civilianLocations = civilians.map(civilian => ({
//             location: civilian.location.coordinates,
//             civilianId: civilian._id
//         }));

//         // 4. Respond with the rescuer's location and the civilians' locations
//         res.json({
//             success: true,
//             rescuerLocation: rescuer.location.coordinates,  // <-- This may be where the problem is
//             civilianLocations
//         });

//     } catch (error) {
//         console.error('Error fetching civilian locations:', error);
//         res.status(500).json({ success: false, message: 'Error fetching civilian locations' });
//     }
// });






module.exports = router;