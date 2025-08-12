const User = require('../models/postgres/user');
const jwt = require('jsonwebtoken');

// exports.register: This defines and exports a function named register. This function will 
// be called by your Express router (authRoutes) whenever a request hits the /register endpoint.
// async (req, res): This is the standard signature for an Express route handler.
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username || !email || !password) {
            // 400 Bad Request error
            return res.status(400).json({ messsage: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            // 409 Conflict error
            return res.status(409).json({ message: 'User with this eamil already exists' });
        }

        // Create new user
        const newUser = await User.create({ username, email, password });
        // 201 Created status code
        res.status(201).json({
            message: 'User created successfully',
            user: {
                userId: newUser.user_id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        // 500 Internal Server Error
        res.status(500).json({ message: 'Server error during registration' });
    }
};