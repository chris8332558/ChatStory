const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const storyController = require('../controllers/storyController'); 

router.use(auth);

// Upload

// @route POST api/stories/presigned-url
// @desc post the presigned url for the midea
// @access Private
router.post('/presigned-url', storyController.getPresigned);

// @route POST api/stories
// @desc post the presigned url for the midea
// @access Private
router.post('/', storyController.createStory);


// Reads
router.get('/rooms/:room_id/active', storyController.listActive);
router.get('/rooms/:room_id/archive', storyController.listArchive);

module.exports = router;