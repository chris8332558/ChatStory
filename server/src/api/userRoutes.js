const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authMiddleware);

// @route GET /api/users/me
// @desc get the user's info (username, email, created_at)
// @access Private
router.get('/me', userController.getMe);

// @route PATCH /api/users/me
// @desc patch the user's info
// @access Private
router.patch('/me', userController.updateMe);

module.exports = router;
