const { pgPool } = require('../config');

function normPair(from, to) {
    return from < to ? [from, to , 1] : [to, from, 2]; // requestor 1 means uid1 sent, 2 means uid2 sent
}

exports.sendRequest = async (req, res) => {
    const from = req.user.id; // Assuming req.user is set by authentication middleware
    const { to_user_id }  = req.body;
    if (!to_user_id || to_user_id === from) return res.status(400).json({ message: 'Invalid to_user_id'});

    const client = await pgPool.connect();
    try {
        await client.query('BEGIN');

        // Check if there's already a existing friendship
        const fr = await client.query('SELECT 1 FROM Friends WHERE user_id = $1 AND friend_id = $2', [from, to_user_id]);
        if (fr.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Already friends'});
        }

        const [uid1, uid2, requestor] = normPair(from, to_user_id);
        await client.query(
            `INSERT INTO friend_requests (uid1, uid2, requestor)
             VALUES ($1, $2, $3)
             ON CONFLICT (LEAST(uid1, uid2), GREATEST(uid1, uid2)) DO NOTHING`,
            [uid1, uid2, requestor]
        );

        await client.query('COMMIT');
        return res.status(202).json({ status: 'pending'});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('friendController.js: Error in sendRequest', error);
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.listRequests = async (req, res) => {
    const user_id = req.user.id; // Assuming req.user is set by authentication middleware

    try {
        // Incoming: Someone sent me a request
        const incoming = await pgPool.query(
            `SELECT request_id, uid1, uid2, requestor, created_at
            FROM friend_requests
            WHERE (uid1 = $1 AND requestor = 2) OR (uid2 = $1 AND requestor = 1)`,
            [user_id]
        );

        // Outgoing: I sent someone a request
        const outgoing = await pgPool.query(
            `SELECT request_id, uid1, uid2, requestor, created_at
            FROM friend_requests
            WHERE (uid1 = $1 AND requestor = 1) OR (uid2 = $1 AND requestor = 2)`,
            [user_id]
        );

        return res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
    } catch (err) {
        console.log('friendController.js: Error in listRequests', err);
        return res.status(500).json({ error: err.message });
    } 
};

exports.acceptRequest = async (req, res) => {
    try {
        const user_id = req.user.id; // Assuming req.user is set by authentication middleware
        const { request_id } = req.params;
        const client = await pgPool.connect();

        try {
            await client.query('BEGIN');
            const r = await client.query(
                `SELECT uid1, uid2, requestor FROM friend_requests
                WHERE request_id = $1 FOR UPDATE`, // lock the row to prevent
                [request_id]
            )
            if (r.rowCount === 0) {
                await client.query('ROLLBACK');
                return res.statue(404).json({ message: 'Request not found' });
            }
            const { uid1, uid2, requestor } = r.rows[0];
            // Only a target can accept (not the requestor)
            const target_uid = requestor === 1 ? uid2 : uid1;
            if (target_uid !== user_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ message: 'Not allowed' });
            }

            // Insert both directions; ON CONFLICT DO NOTHING to avoid duplicate error
            await client.query(
                `INSERT INTO Friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [uid1, uid2]
            );
            await client.query(
                `INSERT INTO Friends (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [uid2, uid1]
            );

            await client.query(
                `DELETE FROM friend_requests WHERE request_id = $1`, [request_id]
            );
            await client.query('COMMIT');
            return res.status(204).send();
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('friendController.js: Error in acceptRequest', err);
        return res.status(500).json({ error: err.message })
    }
};

exports.rejectRequest = async (req, res) => {
    const user_id = req.user.id; // Assuming req.user is set by authentication middleware
    const { request_id } = req.params;

    try {
        const r = await pgPool.query(
            `SELECT uid1, uid2, requestor FROM friend_requests WHERE request_id = $1`, [request_id]
        )

        if (r.rowCount === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const { uid1, uid2, requestor } = r.rows[0];
        const target_id = requestor === 1 ? uid2 : uid1;
        if (target_id !== user_id) {
            return res.status(403).json({ message: 'Not allowed' });
        }
        await pgPool.query(`DELETE FROM friend_requests WHERE request_id = $1`, [request_id]);
        return res.status(204).send();
    } catch (err) {
        console.error('friendController.js: Error in rejectRequest', err);
        return res.status(500).json({ error: err.message })
    }
};

exports.listFriends = async (req, res) => {
    try {
        const user_id = req.user.id; // Assuming req.user is set by authentication middleware
        const r = await pgPool.query(
            `SELECT f.friend_id AS user_id, u.username, u.display_name, u.avatar_url
            FROM Friends f
            JOIN Users u ON u.user_id = f.friend_id
            WHERE f.user_id = $1
            ORDER BY u.username ASC`,
            [user_id]
        )
        return res.json(r.rows)
    } catch (err) {
        console.error('friendController.js: Error in listFriends', err);
        return res.status(500).json({ error: err.message })
    }
};

exports.deleteFriend = async (req, res) => {

};