const express = require('express');
const router = express.Router({ mergeParams: true}); // The router can access to the req.params
const membershipController = require('../controllers/membershipController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// @route POST /api/rooms/:room_id/members
// @docs Add user to a room. Only admin can add it
// @access Private
router.post('/', membershipController.addMember);

// TODO: 
// @route POST /api/rooms/:room_id/members/invites
// router.post('/invites', membershipController.createInvite);

module.exports = router;