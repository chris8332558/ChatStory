const express = require('express');
const router = express.Router({ mergeParams: true }); // the router can access to the req params
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route GET /api/rooms/:room_id/messages
// @docs list messages in a room
// @access Private
router.get('/', messageController.listRoomMessages);

// @route POST /api/rooms/:room_id/messages
// @docs post a message to a room
// @access Private
router.post('/', messageController.postRoomMessage);

module.exports = router;