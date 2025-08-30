const { getDB } = require('../../config/index');

const COLLECTION = 'Messages';

const MessageModel = {
    async create({ room_id, user_id, username, text, createdAt = new Date() }) {
        const db = getDB();
        const doc = { room_id, user_id, username, text, createdAt };
        // MongoDB will assign a unique _id automatically if not supplied
        const res = await db.collection(COLLECTION).insertOne(doc);
        return { _id: res.insertedId, ...doc };
    },

    // Get messages of a room
    async listByRoom({ room_id, limit = 50, before }) {
        const db = getDB();
        const filter = { room_id };
        if (before) {
            // fetch messages older than a given timestamp
            filter.createdAt = { $lt: new Date(before) };
        }
        const items = await db.collection(COLLECTION).find(filter).sort({ createdAt: -1 }).limit(limit).toArray();
        return items;
    },

};

module.exports = MessageModel;