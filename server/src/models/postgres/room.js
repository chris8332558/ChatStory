const { pgPool } = require('../../config');

const Room = {
    // Create a new room and automatically add the creator as a member
    async createRoom( {name, creator_id} ) {
        const client = await pgPool.connect();
        // If the first operation succeeds but the second fails, you'd end up with a room that has no members—not even its creator. 
        // A transaction ensures that either both operations succeed or both fail.
        try {
            await client.query('BEGIN'); // Start transaction
            
            const roomResult = await client.query(
                'INSERT INTO Rooms (name, creator_id) VALUES ($1, $2) RETURNING room_id, name, created_at',
                [name, creator_id]
            );
            const newRoom = roomResult.rows[0];

            await client.query(
                'INSERT INTO Room_Members (user_id, room_id) VALUES ($1, $2)',
                [creator_id, newRoom.room_id]
            );
            
            await client.query('COMMIT') // Commit transaction if everything succeeds
            return newRoom;

        } catch (err) {
            await client.query('ROLLBACK') // Roll back (undo) all changes made within the transaction.
            throw err;
        } finally {
            client.release(); // Return the connection to the pool for reuse.
        }
    },

    // Find all rooms a specific user is a member of
    async findUserRooms(user_id) {
        const result = await pgPool.query(
            'SELECT r.room_id, r.name, r.created_at FROM Rooms r \
            JOIN Room_Members rm ON r.room_id = rm.room_id \
            WHERE rm.user_id = $1 ORDER BY r.name ASC',
            [user_id]
        )
        return result.rows;
    },

    async isMember({ user_id, room_id }) {
        const res = await pgPool.query(
            'SELECT 1 FROM Room_Members WHERE user_id = $1 AND room_id = $2 LIMIT 1',
            [user_id, room_id]
        );
        return res.rowCount > 0;
    },


    // For adding users to the room. Only admin can add
    async isAdmin({ user_id, room_id }) {
        console.log(`room.js::isAdmin: user_id: ${user_id}, room_id: ${room_id}`);
        const res = await pgPool.query(
            'SELECT 1 FROM Rooms WHERE creator_id = $1 AND room_id = $2 LIMIT 1',
            [user_id, room_id]
        );
        return res.rowCount > 0;
    },

    async findUserByEmail({ email }) {
        const res = await pgPool.query(
            'SELECT user_id, username, email FROM Users WHERE email = $1',
            [ email ]
        );
        return res.rows[0] || null;
    },

    // This method safely adds a user to a room without causing errors if they're already a member.
    // The `ON CONFLICT DO NOTHING` Clause: Remember that your room_members table has a UNIQUE (user_id, room_id) constraint.
    // Without ON CONFLICT DO NOTHING, trying to add the same user to the same room twice would cause a database error.
    // With this clause, if the combination already exists, PostgreSQL simply ignores the insertion attempt and continues without error.
    async addUserToRoom({ user_id, room_id }) {
        await pgPool.query(
            'INSERT INTO Room_Members (user_id, room_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [user_id, room_id]
        );
    }
};

module.exports = Room;