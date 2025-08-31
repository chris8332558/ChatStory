const { getDB } = require('../../config/index');

const COLLECTION = 'Messages';


const MessageModel = {
    async create({ room_id, user_id, username, text, created_at = new Date().toISOString() }) {
        const db = getDB();
        const doc = { room_id, user_id, username, text, created_at };
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
            // filter.created_at = { $lt: new Date(before) };
        }
        const items = await db.collection(COLLECTION).find(filter).sort({ created_at: -1 }).limit(limit).toArray();
        return items;
    },

};

module.exports = MessageModel;