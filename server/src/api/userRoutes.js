const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/userController');
const avatarController = require('../controllers/avatarController');
const publicProfileController = require('../controllers/publicProfileController');

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

// @route GET api/users/:user_id/
// @desc get the user's profile
// @access Private
router.get('/:user_id', publicProfileController.getUserProfile);

// @route GET api/users/:user_id/stories/active
// @desc get the user's active stories in the muture rooms 
// @access Private
router.get('/:user_id/stories/active', publicProfileController.getMutualActiveStroies);

// @route GET api/users/:user_id/stories/active
// @desc get the user's archive stories in the muture rooms 
// @access Private
router.get('/:user_id/stories/archive', publicProfileController.getMutualArchiveStroies);

module.exports = router;
