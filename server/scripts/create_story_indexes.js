// This script is not part of your main application code—it's a utility script for database setup. Here's how to use it effectively:
// Navigate to the script's directory in your terminal.
// Run: node scripts/create_story_indexes.js.

require('dotenv').config();
const { MongoClient } = require('mongodb');

// These are defined in the story.js
// const ACTIVE_COLLECTION = 'StoriesActive';
// const ARCHIVE_COLLECTION = 'StoriesArchive';

// It's wrapped in an Immediately Invoked Function Expression (IIFE) to handle asynchronous operations cleanly.
// It's a common pattern in Node.js to run asynchronous code immediately without blocking the main thread. 
// The async keyword allows the use of await inside.
(async () => {
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db();

    // Active stories TTL (Time-To-Live): expire after 24hr from created_at
    // Automatically deletes stories from the StoriesActive collection after 24 hours based on their created_at timestamp. 
    await db.collection('StoriesActive').createIndex(
        { created_at: 1 }, // 1 means ascending order
        { expireAfterSeconds: 86400 } // 24 * 60 * 60
    );

    // Creates compound query indexes on both collections.
    // Ascending index on room_id and descending index on created_at
    await db.collection('StoriesActive').createIndex({ room_id: 1, created_at: -1});
    await db.collection('StoriesArchive').createIndex({ room_id: 1, created_at: -1});

    console.log('Story indexes created');
    await client.close();
})();