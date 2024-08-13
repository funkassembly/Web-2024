const express = require('express');
const router = express.Router();
const User = require('../models/users_model');
const bcrypt = require('bcryptjs');

// Strong password policy
const passwordValidator = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&+=]).{8,}$/;
    return passwordRegex.test(password);
};

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
