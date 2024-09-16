const User = require('../models/usersModel');


exports.getUsers = async (req, res) => {
    try {
        const getUsers = await User.find();
        res.json(getUsers);
        console.log(getUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 
// const User = require('../models/User'); // Make sure the path is correct

// Create a new rescuer
exports.createRescuer = async (req, res) => {
   
    console.log(req.body);

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Username, email, and password are required'
        });
    }

    try {
        const newUser = new User({
            username,
            email,
            password,
            role: 'rescuer' // Default role
        });

        await newUser.save();
        res.status(201).json({
            status: 'success',
            data: newUser
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
