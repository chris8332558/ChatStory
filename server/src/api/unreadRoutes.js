const express = require('express');
const router = express.Router();
const auth= require('../middleware/auth');
const readController = require('../controllers/readController');

// All routes here require authentication
router.use(auth);

router.get('/', readController.listUnread);
router.patch('/rooms/:room_id/read', readController.markRoomRead);
router.patch('/stories/rooms/:room_id/seen', readController.markStoreisSeen);

module.exports = router;