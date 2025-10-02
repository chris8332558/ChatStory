const { pgPool } = require("../config");

exports.markRoomRead = async (req, res) => {
    const user_id = req.user.id;
    const { room_id } = req.params;
    const r = await pgPool.query(`SELECT msg_seq FROM Room_Counters WHERE user_id = $1`, [room_id]);
    if (r.rowCount === 0) return res.status(404).json({ message: 'Room not found' });
    const seq = r.rows[0].msg_seq;
    // Upsert monotonic last_read_seq
    await pgPool.query(`INSERT INTO User_Room_State (user_id, room_id, last_read_seq)
                        VALUES ($1, $2, $3),
                        ON CONFLICT (user_id, room_id) DO UPDATE SET last_read_seq = GREATEST(User_Room_State.last_read_seq, EXCLUDED.last_read_seq)`,
                    [user_id, room_id, seq]);
    
    return res.status(204).send();
};

exports.listUnread = async (req, res) => {
    const user_id = req.user.id;
    
    // Get the list of rooms the user is in with unread counts: row = [(room_id, unread)]
    const rows = await pgPool.query(
        `SELECT rm.room_id, GREATEST(COALESCE(rc.msg_seq, 0) - COALESCE(urs.last_read_seq, 0)) as unread
        FROM Room_Members rm 
        LEFT JOIN Room_Counters rc ON rc.room_id = rm.room_id 
        LEFT JOIN User_Room_State urs ON urs.user_id = rm.user_id AND urs.room_id = rm.room_id 
        WHERE rm.user_id = $1`,
        [user_id]
    );
    const data = rows.rows.map(r => ({ room_id: r.room_od, unread: Math.max(r.msg_seq - r.last_read_seq, 0)}));
    return res.json(data);
};

// For completeness, add PATCH /api/stories/rooms/:roomId/seen to set last_story_seen_at = NOW() via upsert so clients can compute unseen stories as 
// active.createdAt > last_story_seen_at without scanning archives, staying consistent with TTL-based ephemerals
exports.markStoreisSeen = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { room_id } = req.params;
        await pgPool.query(
            `INSERT INTO User_Room_State (user_id, room_id, last_story_seen_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id, room_id) DO UPDATE SET last_story_seen_at = GREATEST(User_Room_State.last_story_seen_at, NOW())`,
            [user_id, room_id]
        );
        return res.status(204).send();
    } catch (err) {
        console.error('markStoriesSeen error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};