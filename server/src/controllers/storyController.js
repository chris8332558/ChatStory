const StoryModel = require('../models/mongo/story');
const Room = require('../models/postgres/room');
const { getPresignedUploadUrl } = require('../services/s3Service');
const crypto = require('crypto');

exports.getPresigned = async (req, res) => {
    try {
        console.log('storyController.js: Start getPresigned()');
        const user_id = req.user.id; // set in auth middleware
        const { room_id, content_type } = req.body;
        console.log(`storyController.js: room_id: ${room_id}, content_type: ${content_type}`);

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

        const { upload_url, media_url } = await getPresignedUploadUrl({ key, content_type });
        console.log('storyController.js: Received uplaod_url and media_url from s3Service.js');
        console.log('upload_url', upload_url);
        console.log('media_url', media_url);
        return res.json({ upload_url, media_url });
    } catch (err) {
        console.error('stroyController.js: getPresigned error: ', err)
        return res.status(500).json({ message: 'stroyController.js: Server error' });
    }
};

exports.createStory = async (req, res) => {
    try {
        console.log('storyController.js: Start createStory()');
        const { room_id, media_url, media_type, duration_ms } = req.body;
        const user_id = req.user.id;
        const username = req.user.username;
        console.error(`storyController.js: room_id: ${room_id}, media_url: ${media_url}, media_type: ${media_type}`);

        if (!room_id || !media_url || !media_type) {
            console.error('storyController.js: miss room_id, media_url, or media_type');
            return res.status(400).json({ messag: 'stroyController.js: room_id, media_url, media_type are required' });
        }

        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: "stroyController.js: Not a room member "});
        }

        const created = await StoryModel.create({
            // default 5s for image
            room_id, user_id, username, media_url, media_type, duration_ms: duration_ms || (media_type.startsWith('image/') ? 5000 : 0)
        });

        return res.status(201).json({
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


exports.listActive = async (req, res) => {
    try {
        const { room_id } = req.params;
        const user_id = req.user.id;

        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: "stroyController.js: Not a room member "});
        }

        const stories = await StoryModel.listActiveByRoom({ room_id });
        return res.json(stories.map(s => ({
            id: s._id,
            user_id: s.user_id,
            username: s.username,
            media_url: s.media_url,
            media_type: s.media_type, // e.g. image/jepg or video/mp4
            duration_ms: s.duration_ms,
            created_at: s.created_at,
            expires_at: s.expires_at,
        })));
    } catch (err) {
        console.error('storyController.js: listActive error: ', err);
        return res.status(500).json({ message: "storyController.js: Server error" });
    }
};


exports.listArchive = async (req, res) => {
    try {
        const { room_id } = req.params;
        const { before, limit } = req.body;
        const user_id = req.user.id;

        const isMember = await Room.isMember({ user_id, room_id });
        if (!isMember) {
            return res.status(403).json({ message: "stroyController.js: Not a room member "});
        }

        const stories = await StoryModel.listArchiveByRoom(
            { room_id, before, limit: Math.min(parseInt(limit || '50', 10), 200) }
        );

        return res.json(stories.map(s => ({
            id: s._id,
            user_id: s.user_id,
            username: s.username,
            media_url: s.media_url,
            media_type: s.media_type, // e.g. image/jepg or video/mp4
            duration_ms: s.duration_ms,
            created_at: s.created_at,
            expires_at: s.expires_at,
        })));

    } catch (err) {
        console.error('storyController.js: listArchive error: ', err);
        return res.status(500).json({ message: "storyController.js: Server error" });
    }
};