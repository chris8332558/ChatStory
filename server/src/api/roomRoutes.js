const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route POST /api/auth/rooms
// @desc Create a new room
// @access Private
router.post('/', roomController.createRoom);

// @route GET /api/auth/rooms
// @desc get all rooms of the authenticated user
// @access Private
router.get('/', roomController.getUserRooms);

module.exports = router;