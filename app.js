const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const { createRescuer } = require('./createRescuer');
const { createCivilian } = require('./createCivilian');
const User = require('./models/users_model');

const app = express();
app.use(express.static('maptry'));


mongoose.connect('mongodb://0.0.0.0:27017/web', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('MongoDB connected...');

    // Call your functions after the connection is established
    return createRescuer('rescuerUser', 'rescuer@example.com', 'StrongPass123!');
})
.then(() => {
    return createCivilian('civilianUser', 'civilian@example.com', 'StrongPass123!');
})
.then(() => {
    console.log('All users created successfully');
})
.catch(err => {
    console.error('Error during user creation:', err);
});

// Middleware
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
    if (req.session.userId) {
        next();
    } else {
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
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'rescuer') {
        next();
    } else {
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
        await createRescuer(username, email, password);
        res.send('Rescuer created successfully');
    } catch (err) {
        res.status(500).send('Error creating rescuer: ' + err.message);
    }
});

// Route to create a civilian (only accessible by admin)
app.post('/createCivilian', isLoggedIn, isAdmin, async (req, res) => {
    const { username, email, password } = req.body;
    try {
        await createCivilian(username, email, password);
        res.send('Civilian created successfully');
    } catch (err) {
        res.status(500).send('Error creating civilian: ' + err.message);
    }
});

// Updated Rescuer Dashboard Route to Include Username
app.get('/rescuerDashboard', isLoggedIn, isRescuer, async (req, res) => {
    const user = await User.findById(req.session.userId);
    res.render('rescuerDashboard', { username: user.username });
});

app.get('/adminDashboard', isLoggedIn, isAdmin, (req, res) => res.send('adminDashboard'));
app.get('/civilianDashboard', isLoggedIn, isCivilian, (req, res) => res.send('civilianDashboard'));
app.get('/rescuerDashboard', isLoggedIn, isRescuer, (req, res) => res.send('rescuerDashboard'));

app.listen(3000, () => console.log('Server running on port 3000'));