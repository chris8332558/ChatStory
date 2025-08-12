// Best practice: Create authentication middleware
// This middleware will protect our future routes (like creating rooms) by verifying the JWT sent by the client.

const jwt = requrie('jsonwebtoken');

// This code exports a single function. This is the standard structure for Express middleware.
// The next is a special function. When called, it passes control to the next middleware or route handler in the chain.
module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        // jwt.verify() checks if the token is expired, verifies the token's signature is valid, 
        // and decodes the token and return its original payload.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // Add the user payload to the request object
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is invalid' });
    }

};