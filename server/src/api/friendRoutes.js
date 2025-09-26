const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const authMiddleware = require('../middleware/auth');
const { pgPool } = require('../config');

router.use(authMiddleware);

// @route POST /api/friends/requests
// @docs Send a friend request to another user
// @access Private
router.post('/requests', friendController.sendRequest);

// @route GET /api/friends/requests
// @docs List incoming and outgoing friend requests
// @access Private
router.get('/requests', friendController.listRequests);

// @route POST /api/friends/requests/:request_id/accept
// @docs Accept a friend request
// @access Private
router.post('/requests/:request_id/accept', friendController.acceptRequest);

// @route POST /api/friends/requests/:request_id/reject
// @docs Reject a friend request
// @access Private
router.post('/requests/:request_id/reject', friendController.rejectRequest);

// @route GET /api/friends
// @docs List all friends
// @access Private
router.get('/', friendController.listFriends);

// @route DELETE /api/friends/:friend_id
// @docs Remove a friend
// @access Private
router.delete('/:friend_id', friendController.deleteFriend);

module.exports = router;