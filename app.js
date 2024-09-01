const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const { createRescuer } = require('./createRescuer');
const { createCivilian } = require('./createCivilian');
const createProducts = require('./createProduct'); // Import the product creation script
const User = require('./models/users_model');
const Product = require('./models/product_model'); 

const app = express();
app.use(express.static('public'));


mongoose.connect('mongodb://0.0.0.0:27017/web', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('MongoDB connected...');

    // Call your functions after the connection is established
    await createRescuer('rescuerUser', 'rescuer@example.com', 'StrongPass123!');
    await createCivilian('civilianUser', 'civilian@example.com', 'StrongPass123!');
    await createCivilian('civilianUser1', 'civilian1@example.com', 'StrongPass123!');
    await createCivilian('civilianUser2', 'civilian2@example.com', 'StrongPass123!');
    await createCivilian('civilianUser3', 'civilian3@example.com', 'StrongPass123!');
    await createCivilian('civilianUser4', 'civilian4@example.com', 'StrongPass123!');
    await createProducts();
    console.log('All users created successfully');
})
.catch(err => {
    console.error('Error during user creation:', err);
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'mysecret', 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));
app.set('view engine', 'ejs');

// Authentication Middleware
const isLoggedIn = (req, res, next) => {
    console.log('isLoggedIn middleware triggered');
    if (req.session.userId) {
        console.log('User is logged in:', req.session.userId);
        next();
    } else {
        console.log('User is not logged in, redirecting to /login');
        res.redirect('/login');
    }
};

const isAdmin = async (req, res, next) => {
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

const isCivilian = async (req, res, next) => {
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'civilian') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

const isRescuer = async (req, res, next) => {
    console.log('isRescuer middleware triggered');
    const user = await User.findById(req.session.userId);
    console.log('Fetched User in isRescuer middleware:', user);
    if (user && user.role === 'rescuer') {
        console.log('User is a rescuer');
        next();
    } else {
        console.log('User is not a rescuer, access forbidden');
        res.status(403).send('Forbidden');
    }
};

// Routes
app.use(authRoutes);

// Redirect root route to the login page
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Route to create a rescuer (only accessible by admin)
app.post('/createRescuer', isLoggedIn, isAdmin, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        await createRescuer(username, email, hashedPassword);
        res.send('Rescuer created successfully');
    } catch (err) {
        res.status(500).send('Error creating rescuer: ' + err.message);
    }
});

// Route to create a civilian (only accessible by admin)
app.post('/createCivilian', isLoggedIn, isAdmin, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        await createCivilian(username, email, hashedPassword);
        res.send('Civilian created successfully');
    } catch (err) {
        res.status(500).send('Error creating civilian: ' + err.message);
    }
});

app.get('/rescuerDashboard', isLoggedIn, isRescuer, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        console.log('Rescuer username:', user.username); // Debugging line to check if username is retrieved

        res.render('rescuerDashboard', { username: user.username }); // Passing username to the template
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/updateRescuerLocation', isLoggedIn, isRescuer, async (req, res) => {
    console.log("Update location endpoint hit");
    let { lat, lng } = req.body;
    console.log('Received values from req.body:', req.body);


    // Convert lat and lng to numbers
    lat = parseFloat(req.body.lat);
    lng = parseFloat(req.body.lng);

    console.log(`Parsed lat: ${lat}, lng: ${lng}`);
    try {
        const user = await User.findById(req.session.userId);
        console.log('User ID from session:', req.session.userId);
        console.log('Fetched User:', user);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid lat or lng values:', lat, lng);
            return res.status(400).json({ success: false, error: 'Invalid coordinates' });
        }

        user.location.coordinates = [lat, lng]; 
        console.log('Updated User Location:', user.location.coordinates);
        await user.save();
        console.log('User after save:', user);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Route to fetch products from the general storage
app.get('/getProducts', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route to save cargo to the database
app.post('/saveCargo', isLoggedIn, isRescuer, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { cargo } = req.body;

        // Find the rescuer and update their cargo
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Validate product IDs in cargo
        for (const item of cargo) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(400).json({ success: false, message: 'Invalid product ID' });
            }
             // Check stock availability
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: 'Insufficient stock for product: ' + product.name });
            }

            // Update product stock
            product.stock -= item.quantity;
            await product.save();

            // Update the rescuer's cargo
            const existingCargoItem = user.cargo.find(cargoItem => cargoItem.productId.toString() === item.productId);
            if (existingCargoItem) {
                // If product already exists in cargo, just update the quantity
                existingCargoItem.quantity += item.quantity;
            } else {
                // If product is not in cargo, add it as a new item
                user.cargo.push({ productId: item.productId, quantity: item.quantity });
            }
        }

        // Update the rescuer's cargo
        
        await user.save();

        res.json({ success: true, message: 'Cargo saved successfully' });
    } catch (error) {
        console.error('Error saving cargo:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/getCargo', isLoggedIn, isRescuer, async (req, res) => {
    console.log('getCargo route hit');  // Debugging line
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).populate('cargo.productId'); // Populate to get product details

        if (!user) {
            console.log('User not found'); 
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        console.log('Returning user cargo:', user.cargo);
        res.json({ success: true, cargo: user.cargo });
    } catch (error) {
        console.error('Error fetching cargo:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/unloadCargo', isLoggedIn, isRescuer, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { items } = req.body;

        // Find the rescuer
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        for (const item of items) {
            const { productId, quantity } = item;
            const cargoItemIndex = user.cargo.findIndex(cargoItem => cargoItem.productId.toString() === productId);

            if (cargoItemIndex === -1) {
                return res.status(400).json({ success: false, message: 'Product not found in cargo' });
            }

            const cargoItem = user.cargo[cargoItemIndex];

            if (cargoItem.quantity < quantity) {
                return res.status(400).json({ success: false, message: `Not enough quantity in cargo for product: ${cargoItem.productId}` });
            }

            // Deduct the quantity from cargo
            cargoItem.quantity -= quantity;

            // If the quantity becomes zero, remove the item from the cargo
            if (cargoItem.quantity === 0) {
                user.cargo.splice(cargoItemIndex, 1);
            }

            // Update the stock in general storage
            const product = await Product.findById(productId);
            product.stock += quantity;
            await product.save();
        }

        await user.save();

        res.json({ success: true, message: 'Cargo updated and products returned to storage.' });
    } catch (error) {
        console.error('Error unloading cargo:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/getCategories', async (req, res) => {
    try {
        // Fetch unique category numbers from the products collection
        const categories = await Product.distinct('category');
        res.json(categories); // Send the array of unique categories to the frontend
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Route to get products, optionally filtered by category
app.get('/getProducts', async (req, res) => {
    try {
        const { category } = req.query;
        let products;
        
        if (category) {
            products = await Product.find({ category: category }); // Fetch products filtered by category
        } else {
            products = await Product.find(); // Fetch all products
        }
        
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/updateCivilianLocation', isLoggedIn, isCivilian, async (req, res) => {
    console.log("Update location endpoint hit");
    let { lat, lng } = req.body;

    // Convert lat and lng to numbers
    lat = parseFloat(lat);
    lng = parseFloat(lng);

    console.log(`Parsed lat: ${lat}, lng: ${lng}`);
    try {
        // Reload the document before updating
        const user = await User.findById(req.session.userId).exec();
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid lat or lng values:', lat, lng);
            return res.status(400).json({ success: false, error: 'Invalid coordinates' });
        }

        user.location.coordinates = [lat, lng];
        console.log('Updated User Location:', user.location.coordinates);

        await user.save();
        console.log('User after save:', user);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


// Route to save a request for a Civilian
app.post('/saveCivilianRequest', isLoggedIn, isCivilian, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Add the new request to the user's requests array
        user.requests.push(req.body);

        await user.save();
        res.json({ success: true, message: 'Request saved successfully' });
    } catch (error) {
        console.error('Error saving request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getRequestHistory', isLoggedIn, isCivilian, async (req, res) => {
    try {
        // Find the user and populate the product details within the requests
        const user = await User.findById(req.session.userId).populate('requests.products.product');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Format the requests to include the product names
        const formattedRequests = user.requests.map(request => {
            return {
                ...request._doc, // Spread the request details
                products: request.products.map(product => {
                    return {
                        ...product._doc,
                        name: product.product.name // Attach the product name directly
                    };
                })
            };
        });

        // Sort requests by date in ascending order
        const sortedRequests = formattedRequests.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(sortedRequests);
    } catch (error) {
        console.error('Error fetching request history:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

app.get('/getDonationHistory', isLoggedIn, isCivilian, async (req, res) => {
    try {
        // Find the user by session ID
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        // Ensure donations exist and are an array
        if (!user.donations || !Array.isArray(user.donations)) {
            return res.status(404).json({ success: false, message: 'No donations found' });
        }
        // Format the donations to include the product names
        const formattedDonations = user.donations.map(donation => {
            return {
                ...donation._doc, // Spread the donation details
                products: donation.products.map(product => {
                    return {
                        ...product, // Attach all product details directly
                        name: product.name // Directly access the product name
                    };
                })
            };
        });

        // Sort donations by date in ascending order
        const sortedDonations = formattedDonations.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(sortedDonations);
    } catch (error) {
        console.error('Error fetching donation history:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});


app.delete('/deleteRequest/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        const user = await User.findOne({ "requests._id": requestId });

        if (user) {
            // Filter out the request with the matching ID
            user.requests = user.requests.filter(request => request._id.toString() !== requestId);
            
            await user.save(); // Save the updated user document
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Request not found' });
        }
    } catch (error) {
        console.error('Error deleting request:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.delete('/deleteDonation/:donationId', async (req, res) => {
    const { donationId } = req.params;

    try {
        // Find the user who made the donation
        const user = await User.findOne({ 'donations._id': donationId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Remove the donation with the given ID
        user.donations.id(donationId).remove();

        // Save the updated user
        await user.save();

        res.json({ success: true, message: 'Donation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting donation:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/getCiviliansWithActions', isLoggedIn, isRescuer, async (req, res) => {
    try {
        // Find all users who are civilians and have at least one request or donation
        const civilians = await User.find({
            role: 'civilian',
            $or: [
                { "requests.0": { $exists: true } },
                { "donations.0": { $exists: true } }
            ]
        })
        .populate({
            path: 'requests.products.product', // Path to populate within requests
            select: 'name category details', // Select only the fields you need from the Product model
        })
        
        .select('username location requests donations'); // Select only location, requests, and donations fields

        res.json({ success: true, civilians });
    } catch (error) {
        console.error('Error fetching civilians:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.get('/getUsernameById/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('username');

        if (user) {
            res.json({ success: true, username: user.username });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error fetching username by ID:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/serveRequest', isLoggedIn, isRescuer, async (req, res) => {
    try {
        const rescuerId = req.session.userId;
        const { type, civilianId, details } = req.body;

        if (!type || !details) {
            return res.status(400).json({ success: false, message: 'Type and details are required' });
        }


        // Find the rescuer by ID
        const rescuer = await User.findById(rescuerId);
        if (!rescuer) {
            return res.status(404).json({ success: false, message: 'Rescuer not found' });
        }
        // Convert details object to a JSON string
        const detailsString = JSON.stringify(details);
        
        // Add the task to the rescuer's tasks
        rescuer.tasks.push({ type, civilianId, details: detailsString });
        await rescuer.save();

        res.json({ success: true, message: 'Task added successfully' });
    } catch (error) {
        console.error('Error assigning task:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


// Route to get tasks for the rescuer
// Route to get tasks for the rescuer
app.get('/getTasks', isLoggedIn, isRescuer, async (req, res) => {
    try {
        // Fetch the user with populated tasks and civilian data
        const user = await User.findById(req.session.userId).populate('tasks.civilianId');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Now, user.tasks will have the populated civilian data
        const tasks = user.tasks.map((task, index) => {
            let details;
            
            // Check if details is already an object or a string
            if (typeof task.details === 'string') {
                details = JSON.parse(task.details || '{}');
            } else {
                details = task.details || {};
            }

            return {
                _id: task._id,
                username: task.civilianId.username, // Civilian's username
                location: task.civilianId.location,
                type: task.type,
                details: details,
                deliveryDate: details.deliveryDate || 'N/A',
                deliveryTimeSlot: details.deliveryTimeSlot || { hours: 'N/A', minutes: 'N/A' }
            };
        });

        res.json({ success: true, tasks });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});



app.delete('/deleteTask/:taskId', isLoggedIn, isRescuer, async (req, res) => {
    try {
        const taskId = req.params.taskId;
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find the task by ID and remove it from the array
        const taskIndex = user.tasks.findIndex(task => task._id.toString() === taskId);
        if (taskIndex !== -1) {
            user.tasks.splice(taskIndex, 1); // Remove the task
        } else {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await user.save();
        res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});


app.post('/serveSelectedRequests', isLoggedIn, isRescuer, async (req, res) => {
    const { civilianId, selectedRequestIds } = req.body;

    try {
        const civilian = await User.findById(civilianId);
        if (!civilian) {
            return res.status(404).json({ success: false, message: 'Civilian not found' });
        }

        // Mark the selected requests as served
        civilian.requests.forEach(request => {
            if (selectedRequestIds.includes(request._id.toString())) {
                request.status = 'served';
            }
        });

        await civilian.save();

        res.json({ success: true, message: 'Requests served successfully' });
    } catch (error) {
        console.error('Error serving requests:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});





app.get('/adminDashboard', isLoggedIn, isAdmin, (req, res) => res.send('adminDashboard'));
app.get('/civilianDashboard', isLoggedIn, isCivilian, (req, res) => res.send('civilianDashboard'));

app.listen(3000, () => console.log('Server running on port 3000'));