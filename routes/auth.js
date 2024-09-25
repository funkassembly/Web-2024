const express = require('express');
const router = express.Router();
const User = require('../models/usersModel');
const bcrypt = require('bcryptjs');




// Strong password policy
const passwordValidator = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;
    return passwordRegex.test(password);
};

// Updated getCoordinates using Nominatim API
const getCoordinates = async (street, number, city) => {
    
    const fullAddress = `${number}%20${street},%20${city},%20Greece`;
    // const encodedAddress = encodeURIComponent(fullAddress);
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${fullAddress}&format=json&limit=1`;
    console.log(`Nominatim API URL: ${apiUrl}`); // Log the full URL
    try {
        // Use node-fetch to make the API call
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Web_2024/1.0' // Customize the User-Agent string
            }
        });
        const data = await response.json();

        if (data && data.length > 0) {
            const { lon, lat } = data[0]; // Nominatim returns lon/lat
            return { lat: parseFloat(lat), lng: parseFloat(lon) };
        } else {
            throw new Error('Could not retrieve coordinates from Nominatim.');
        }
    } catch (error) {
        console.error('Error in Nominatim geocoding:', error.message);
        throw error; // Re-throw the error to handle it in the calling function
    }
};

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next(); // User is authenticated, proceed to the next middleware or route handler
    }
    res.redirect('/login'); // User not logged in, redirect to the login page
};

// Render signup and login views
router.get('/', (req, res) => {
    res.render('login');
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/login', (req, res) => {
    res.render('login');
});

// Apply isAuthenticated middleware to the dashboard routes
router.get('/adminDashboard', isAuthenticated, (req, res) => {
    res.render('adminDashboard');
});

router.get('/civilianDashboard', isAuthenticated, (req, res) => {
    res.render('civilianDashboard');
});

router.get('/rescuerDashboard', isAuthenticated, (req, res) => {
    res.render('rescuerDashboard');
});

// POST request for signing up new users
router.post('/signup', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!passwordValidator(password)) {
        return res.render('signup', { error: 'Password does not meet security requirements.' });
    }

    
    
    try {
        const newUser = await User.create({ username, email, password, role });
        res.redirect('/login');
    } catch (err) {
        res.render('signup', { error: 'Error in signup: ' + err.message });
    }
});


// POST request for logging in users
router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: login }, { username: login }]
        });

        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.render('login', { error: 'Incorrect email or password' });
        }

        req.session.userId = user._id;

        if (user.role === 'admin') {
            res.redirect('/adminDashboard');
        } else if (user.role === 'civilian') {
            res.redirect('/civilianDashboard');
        } else if (user.role === 'rescuer') {
            res.redirect('/rescuerDashboard');
        }
    } catch (err) {
        res.render('login', { error: 'Error in login: ' + err.message });
    }
});


// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
