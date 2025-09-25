const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');
const avatarController = require('../controllers/avatarController');

router.use(authMiddleware);

// @route GET /api/users/me
// @desc get the user's info (username, email, created_at)
// @access Private
router.get('/me', userController.getMe);

// @route PATCH /api/users/me
// @desc patch the user's info
// @access Private
router.patch('/me', userController.updateMe);

// @route POST api/users/me/avatar/presigned-url
// @desc post the presigned url for the avatar (profile photo) 
// @access Private
router.post('/me/avatar/presigned-url', avatarController.getAvatarPresigned);

module.exports = router;
