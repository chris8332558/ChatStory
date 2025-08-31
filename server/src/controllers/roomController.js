const Room = require('../models/postgres/room');

exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;
        const creator_id = req.user.id; // From the auth middleware
        console.log(`roomController: createRoom: creator_id: ${creator_id}`);

        if (!name) {
            return res.status(400).json({ message: 'Room name is required' });
        }

        const newRoom = await Room.createRoom({ name, creator_id });
        res.status(201).json(newRoom);
    } catch (err) {
        console.error('roomController: create room error:', err)
        res.status(501).json({ message: 'Server error' });
    }
};

exports.getUserRooms = async (req, res) => {
    try {
        console.log('roomController: try to getUserRooms');
        const user_id = req.user.id;
        console.log(`roomController::getUserRooms: user_id: ${user_id}`);
        const rooms = await Room.findUserRooms(user_id);
        res.json(rooms);
    } catch (err) {
        console.error('roomController: Get rooms error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// exports.addUserToRoom = async (req, res)