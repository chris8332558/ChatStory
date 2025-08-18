// This file defines the API endpoint and links it to the controller logic.
// The goal of this file is to keep your routing logic organized. 
// Instead of cluttering your main app.js file with every single API route, 
// you group related routes into their own files. This authRoutes.js file is 
// specifically for authentication-related endpoints like registration and login.
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController');


// These are documentation for the API endpoint
// @route POST /api/auth/register
// @desc Register a new user
// @access Public
router.post('/register', authController.register)

// jwt is almost certainly used in the corresponding 
// login function (which would also be in this file) to create authentication tokens.
// @route POST /api/auth/login
// @desc Authenticate user & get token
// @access Public
router.post('/login', authController.login);


// This line exports the fully configured router object. 
// This makes it available to be imported and used by your main app.js file, 
// which is exactly what happens with the app.use('/api/auth', authRoutes) line.
module.exports = router;