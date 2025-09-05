// This file ties everything in the backend together: it starts the server, 
// connects to the database, and sets up middleware and routes.

const express = require('express');
const authRoutes = require('./api/authRoutes');
const roomRoutes = require('./api/roomRoutes');
const messageRoutes = require('./api/messageRoutes');


// This line creates an instance of an Express application. 
// The app object is the core of your server; you will use it to configure everything else.
const app = express();

// Middleware to parse JSON bodies
// app.use(express.json()): This is a crucial piece of built-in middleware. 
// It tells your Express app to automatically parse any incoming request that 
// has a Content-Type: application/json header. It converts the JSON string from 
// the request body into a JavaScript object and attaches it to req.body, 
// making it easy to work with in your route handlers.
app.use(express.json());

// API Routes: app.use(...) is used here to set up your API routing.
// It tells Express: "For any request that begins with the path /api/auth, 
// pass the handling of that request over to the authRoutes router."
// For example, if a request comes in for `/api/auth/register`, 
// Express will look inside the authRoutes file for a handler that matches the `/register` path. 
// This keeps your main app.js file clean and delegates logic to specialized files.
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/rooms/:room_id/messages', messageRoutes); 
// In messageRoutes.js, need to have 'const router = express.Router({ mergeParams: true });' so the child router will be able to see the parents' params, e.g. room_id here
// e.g. can access req.params.room_id to know which room is being addressed.

// Simple health check route
// When a request hits this endpoint, the callback function (req, res) => {...} is executed, 
// and it simply sends the plain text response "Server is running!" back to the client. 
// This is a common way to quickly verify that your server is up and responding.
app.get('/', (req, res) => {
    console.log('Server is running!');
    res.send('Server is running!');
});


module.exports = app;