const User = require('../models/postgres/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')

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


// Login: Find the user by emila, compare the password, and if they match, generate a JWT.
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if ( !email || ! password ) {
            return res.status(400).json({ message: 'Pleasw provide email and password' });
        }

        // 1. Find user in the database
        const user = await User.findByEmail(email);
        if (!user) { 
            // Use a generic message for securiity
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 2. Compare the provided email with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401). json({ message: 'Invalid credentials' })
        }

        // 3. Create a JWT payload
        // The payload should contain non-sensitive information that helps 
        // identify the user in future requests (like their ID and username). 
        // You should never include sensitive data like the password hash in the payload
        const payload = {
            user: {
                id: user.user_id,
                username: user.username,
            },
        };

        // 4. Sign the token
        jwt.sign(payload, 
            process.env.JWT_SECRET, // This is used to create a unique, verifiable signature. 
            { expiresIn: '7d' }, // Token expires in 7 days
            (err, token) => { // callback
                if (err) throw err;
                res.json({ token }); // Send a token to the client, the client will then store this token and send it with every subsequent request to access protected parts of the API.
            }
        );

    } catch (error) {
        console.error('Login error: ', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
