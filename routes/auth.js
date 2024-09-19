const express = require('express');
const router = express.Router();
const {User, Civilian, Rescuer, Admin} = require('../models/usersModel');
const bcrypt = require('bcryptjs');

// Strong password policy
const passwordValidator = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;
    return passwordRegex.test(password);
};

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/signup', (req, res) => {
    res.render('signup');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/adminDashboard', (req, res) => {
    res.render('adminDashboard');
});

router.get('/civilianDashboard', (req, res) => {
    res.render('civilianDashboard');
});

router.get('/rescuerDashboard', (req, res) => {
    res.render('rescuerDashboard');
});

router.post('/signup', async (req, res) => {
    // Extract the form data
    console.log(req.body);
    const { username, name, email, cellphone, password, street, number, city, country, zip, role = 'civilian' } = req.body;

    // Password validation (example)
    if (!passwordValidator(password)) {
        return res.render('signup', { error: 'Password does not meet security requirements.' });
    }

    try {
        // Create the new user with all the fields
        const newUser = await Civilian.create({
            username,
            name,
            email,
            cellphone,
            password,
            role,  // Role is fixed to 'civilian' or can be dynamically chosen
            address: {
                street,
                number,
                city,
                country,
                zip
            }
        });

        // Redirect to login after successful signup
        res.redirect('/login');
    } catch (err) {
        // Handle any errors and show the signup page with an error message
        res.render('signup', { error: 'Error in signup: ' + err.message });
    }
});


router.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        console.log(`Finding user with username or email: ${login}`);
        // Look for the user in the base model (User) which includes all roles
        const user = await User.findOne({
            $or: [{ username: login }, { email: login }] // Search by either username or email
        });
        
        console.log(user);
        
        // If user is not found, return error
        if (!user) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Check if the entered password matches the hashed password
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.render('login', { error: 'Invalid username or password.' });
        }

        // Redirect based on the user's role
        if (user.role === 'civilian') {
            // Redirect to civilian dashboard
            return res.redirect('/civilianDashboard');
        } else if (user.role === 'rescuer') {
            // Redirect to rescuer dashboard
            return res.redirect('/rescuerDashboard');
        } else if (user.role === 'admin') {
            // Redirect to admin dashboard
            return res.redirect('/adminDashboard');
        }

        // Handle case if no matching role is found
        return res.render('login', { error: 'User role not recognized.' });

    } catch (err) {
        // Handle any errors
        return res.render('login', { error: 'Error in login: ' + err.message });
    }
});


// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});



module.exports = router;
