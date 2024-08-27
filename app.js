const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const { createRescuer } = require('./createRescuer');
const { createCivilian } = require('./createCivilian');
const createProducts = require('./createProduct'); // Import the product creation script
const User = require('./models/users_model');

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



app.get('/adminDashboard', isLoggedIn, isAdmin, (req, res) => res.send('adminDashboard'));
app.get('/civilianDashboard', isLoggedIn, isCivilian, (req, res) => res.send('civilianDashboard'));

app.listen(3000, () => console.log('Server running on port 3000'));