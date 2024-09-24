const express = require('express');
const router = express.Router();
const { User, Civilian, Rescuer, Admin } = require('../models/usersModel'); // Use role-specific models
const bcrypt = require('bcryptjs');

// Strong password policy
const passwordValidator = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;
    return passwordRegex.test(password);
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
    const { username, email, password, role, name, cellphone, address } = req.body;

    // Validate password strength
    if (!passwordValidator(password)) {
        return res.render('signup', { error: 'Password does not meet security requirements.' });
    }

    try {
        let newUser;

        // Create user based on role
        if (role === 'civilian') {
            newUser = new Civilian({ username, email, password, name, cellphone, address });
        } else if (role === 'rescuer') {
            newUser = new Rescuer({ username, email, password });
        } else if (role === 'admin') {
            newUser = new Admin({ username, email, password });
        } else {
            return res.render('signup', { error: 'Invalid role specified.' });
        }

        // Save the new user
        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        console.error('Error during signup:', err);
        res.render('signup', { error: 'Error in signup: ' + err.message });
    }
});

// POST request for logging in users
router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        // Find user by either email or username
        const user = await User.findOne({
            $or: [{ email: login }, { username: login }]
        });

        // Check if user exists and if password is correct
        if (!user || !(await user.correctPassword(password, user.password))) {
            return res.render('login', { error: 'Incorrect email or password' });
        }

        // Save user ID in the session
        req.session.userId = user._id;

        // Redirect to the appropriate dashboard based on role
        if (user.role === 'admin') {
            res.redirect('/adminDashboard');
        } else if (user.role === 'civilian') {
            res.redirect('/civilianDashboard');
        } else if (user.role === 'rescuer') {
            res.redirect('/rescuerDashboard');
        } else {
            res.render('login', { error: 'Unknown role. Cannot log in.' });
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.render('login', { error: 'Error in login: ' + err.message });
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
