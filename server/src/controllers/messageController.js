const Room = require('../models/postgres/room');
const Message = require('../models/mongo/message');

exports.listRoomMessages = async (req, res) => {
    try {
        console.log('messageController: listRoomMessages, req.params:', req.params);
        const { room_id } = req.params; // extract room_id from URL params
        const { limit, before } = req.query;
        // const { limit } = req.query;
        const user_id = req.user.id; // set by auth middleware

        console.log(`messageController: listRoomMessages: room_id: ${room_id}, limit: ${limit}, before: ${before}, user_id: ${user_id}`);
        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this room' });
        }

        const msgs = await Message.listByRoom({
            room_id, 
            limit: Math.min(parseInt(limit || '50', 10), 100), 
            before});
        
        // Maps MongoDB docs to API-friendly json
        res.json(
            msgs.map(m => ({
                _id: m._id,
                room_id: m.room_id,
                user_id: m.user_id,
                username: m.username,
                text: m.text,
                createdAt: m.createdAt,
            }))
        );
    } catch (err) {
        console.error('listRoomMessages error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};


exports.postRoomMessage = async (req, res) => {
    try {
        const { room_id } = req.params;
        const { text } = req.body;
        const user_id = req.user.id; // from auth middleware
        const username = req.user.name; // from auth middleware

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Text is required' });
        }

        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: 'Not a member of this room' });
        }

        const created = await Message.create({
            room_id, user_id, username, text: text.trim(),
        });

        res.status(201).json({
            id: created.id,
            room_id: created.room_id,
            user_id: created.user_id,
            username: created.username,
            text: created.text,
            createdAt: created.createdAt,
        });
    } catch (err) {
        console.error('postRoomMessage error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
