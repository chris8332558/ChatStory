const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/auth'); // The JWT middleware

router.use(authMiddleware);

// @route POST /api/rooms
// @desc Create a new room
// @access Private
router.post('/', roomController.createRoom);

// @route GET /api/rooms
// @desc get all rooms of the authenticated user
// @access Private
router.get('/', roomController.getUserRooms);


// @route GET /api/rooms/:room_id
// @desc get the room with its room_id
// @access Private
router.get('/:room_id', roomController.getRoomByRoomId)

module.exports = router;