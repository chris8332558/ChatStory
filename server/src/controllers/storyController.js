const StoryModel = require('../models/mongo/story');
const Room = require('../models/postgres/room');
const { getPresignedUploadUrl } = require('../services/s3Service');

exports.getPresigned = async (req, res) => {
    try {
        const user_id = req.user.id; // set in auth middleware
        const { room_id, content_type } = req.body;

        if (!room_id || !content_type) {
            return res.status(400).json({ message: "stroyController.js: room_id and content_type are required" });
        }

        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: "stroyController.js: Not a room member "});
        }

        // crypto: Node.js built-in module for generating random bytes, used here to create unique file names to avoid collisions
        // extract the file extension from content_type (e.g. 'jpeg' from 'image/jpeg')
        const ext = content_type.includes('/') ? content_type.split('/')[1] : 'bin';
        const key = `rooms/${room_id}/stories/${user_id}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

        const { upload_url, media_url } = getPresignedUploadUrl({ key, content_type });
        return res.json({ upload_url, media_url });
    } catch (err) {
        console.error('stroyController.js: getPresigned error: ', err)
        return res.status(500).json({ message: 'stroyController.js: Server error' });
    }
};

exports.createStory = async (req, res) => {
    try {
        const { room_id, media_url, media_type, duration_ms } = req.params;
        const user_id = req.user.id;
        const username = req.user.username;

        if (!room_id || !media_url || !media_type) {
            return res.statue(400).json({ messag: 'stroyController.js: room_id, media_url, media_type are required' });
        }

        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: "stroyController.js: Not a room member "});
        }

        const created = await StoryModel.create({
            // default 5s for image
            room_id, user_id, username, media_url, media_type, duration_ms: duration_ms || (media_type.startsWith('image/') ? 5000 : 0)
        });

        return req.status(201).json({
            id: created._id,
            room_id: created.room_id,
            user_id: created.user_id,
            username: created.username,
            media_url: created.media_url,
            media_type: created.media_type, // e.g. image/jepg or video/mp4
            duration_ms: created.duration_ms,
            created_at: created.created_at,
            expires_at: created.expires_at,
        });
    } catch (err) {
        console.error('stroyController.js: createStory error: ', err)
        return res.status(500).json({ message: 'stroyController.js: Server error' });
    }
};


// exports.listActive
// exports.listArchive