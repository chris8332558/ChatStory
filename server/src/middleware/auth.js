// Best practice: Create authentication middleware
// This middleware will protect our future routes (like creating rooms) by verifying the JWT sent by the client.

const jwt = require('jsonwebtoken');

// This code exports a single function. This is the standard structure for Express middleware.
// The next() is a special function. When called, it passes control to the next middleware or route handler in the chain, e.g. roomRoutes.
module.exports = function (req, res, next) {
    console.log('auth: enter auth middleware');
    // Get token from header, which is added from client
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        console.log('auth: No token, authorization denied');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // jwt.verify() checks if the token is expired, verifies the token's signature is valid, 
        // and decodes the token and return its original payload.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Add the user payload to the request object
        console.log(`auth: req.user: ${req.user.json}`);
        next(); // The next middleware will be able to use req.user.id, e.g. in roomController.createRoom()
    } catch (err) {
        res.status(401).json({ message: 'Token is invalid' });
    }

};