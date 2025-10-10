const User = require('../models/postgres/user');
const Room = require('../models/postgres/room');
const StoryModel = require('../models/mongo/story');

// GET /api/users/:user_id
exports.getUserProfile = async (req, res) => {
    try {
        const { user_id } = req.params;
        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found'});
        }

        return res.json({
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
        });
    } catch (err) {
        console.error('publicProfileController.js: Get user profiel error: ', err);
        return res.statue(500).json({ message: 'Server Error'});
    }
};

exports.getMutualActiveStroies = async (req, res) => {
    try {
        const current_user_id = req.user.id;
        const { user_id: other_user_id } = req.params;
        console.log(`publicProfileController.js: current_user_id=${current_user_id}, other_user_id=${other_user_id}`)

        const mutual_room_ids = await Room.findCommonRooms({ user_a_id: current_user_id, user_b_id: other_user_id });
        if (mutual_room_ids.length === 0) {
            console.log('publicProfileController.js: No common room');
            return res.json([]);
        }

        // The user_id needs to be a number, and the room_id needs to be string (because useLocalParam parse the param as string)
        const number_other_user_id = parseInt(other_user_id, 10);
        const string_mutual_room_ids = mutual_room_ids.map(n => n.toString());

        const stories = await StoryModel.listActiveByRoomsAndUser({ room_ids: string_mutual_room_ids, user_id: number_other_user_id });
        return res.json(stories);
    } catch (err) {
        console.error('Get mutual active stories error: ', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMutualArchiveStroies = async (req, res) => {
    try {
        const current_user_id = req.user.id;
        const { user_id: other_user_id } = req.params;
        // console.log(`publicProfileController.js: current_user_id=${current_user_id}, other_user_id=${other_user_id}`)

        const mutual_room_ids = await Room.findCommonRooms({ user_a_id: current_user_id, user_b_id: other_user_id });
        if (mutual_room_ids.length === 0) {
            // console.log('publicProfileController.js: No common room');
            return res.json([]);
        }

        // The user_id needs to be a number, and the room_id needs to be string (because useLocalParam parse the param as string)
        const number_other_user_id = parseInt(other_user_id, 10);
        const string_mutual_room_ids = mutual_room_ids.map(n => n.toString());

        const stories = await StoryModel.listArchiveByRoomsAndUser({ room_ids: string_mutual_room_ids, user_id: number_other_user_id, before: null });
        // console.log(`publicProfileController.js: Find mutual archive stories: ${stories.length}`);
        return res.json(stories);
    } catch (err) {
        console.error('publicProfileController.js: Get mutual archive stories error: ', err);
        res.status(500).json({ message: 'Server error' });
    }
};