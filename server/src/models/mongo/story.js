const { getDB } = require('../../config/index');
// const { StoryType } = require("../../../../shared/types");

const ACTIVE_COLLECTION = 'StoriesActive';
const ARCHIVE_COLLECTION = 'StoriesArchive';

const StoryModel = {
    async create({room_id, user_id, username, media_url, media_type, duration_ms, thumbnail_url = null, created_at = new Date()}) {
        // Create both active and archive story
        console.log('story.js::create')
        const db = getDB();
        const expires_at = new Date(created_at.getTime() + 24 * 60 * 60 * 1000); // 24h

        const activeDoc = {
            room_id,
            user_id,
            username,
            media_url,
            media_type, // e.g. image/jepg or video/mp4
            duration_ms,
            thumbnail_url, // for video, can be null for image
            created_at,
            expires_at,
        }

        const res = await db.collection(ACTIVE_COLLECTION).insertOne(activeDoc);

        // Archive now (copy) for durability and fast post-expiry queries
        const archiveDoc = { ...activeDoc, active_id: res.insertedId };
        await db.collection(ARCHIVE_COLLECTION).insertOne(archiveDoc);
        
        return { _id: res.insertedId, ...activeDoc };

    },

    async listActiveByRoom({ room_id, limit = 100 }) {
        const db = getDB()
        const now = new Date();
        const item = await db
            .collection(ACTIVE_COLLECTION)
            .find({ room_id, expires_at: { $gt: now }})
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return item;
    },

    async listArchiveByRoom({ room_id, before, limit=100 }) {
        console.log(`story.js: listArchiveByRoom: before=${before}, limit=${limit}`);
        const db = getDB();
        const filter = { room_id };
        if (before) {
            filter.created_at = { $lt: new Date(before) };
        }
        const item = await db
            .collection(ARCHIVE_COLLECTION)
            .find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return item;
    },

    async listActiveByUser({ user_id, limit = 100 }) {
        console.log(`story.js: listActiveByUser: limit=${limit}`);
        const db = getDB();
        const filter = { user_id };
        const item = await db
            .collection(ACTIVE_COLLECTION)
            .find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return item;
    },

    async listArchiveByUser({ user_id, before, limit=100 }) {
        console.log(`story.js: listArchiveByUser: before=${before}, limit=${limit}`);
        const db = getDB();
        const filter = { user_id };
        if (before) {
            filter.created_at = { $lt: new Date(before) };
        }
        const item = await db
            .collection(ARCHIVE_COLLECTION)
            .find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return item;
    },

    async listActiveByRoomsAndUser({ room_ids, user_id, limit = 100 }) {
        const db = getDB()
        const now = new Date();
        const filter = { user_id: user_id, room_id: { $in: room_ids }, expires_at: { $gt: now }}
        const item = await db
            .collection(ACTIVE_COLLECTION)
            .find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return item;
    },

    async listArchiveByRoomsAndUser({ room_ids, user_id, before, limit = 100 }) {
        const db = getDB()
        const now = new Date();
        const filter = { user_id: user_id, room_id: { $in: room_ids } }
        if (before) {
            filter.created_at = { $lt: new Date(before) };
        }
        const item = await db
            .collection(ARCHIVE_COLLECTION)
            .find(filter)
            .sort({ created_at: -1 })
            .limit(limit)
            .toArray();

        return item;
    },
}

module.exports = StoryModel;