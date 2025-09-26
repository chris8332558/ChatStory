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
        res.status(201).json({ status: 'pending'});
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
            WHERE (uid1 = $1 AND requestor = 1) OR (uid2 = $1 AND requestor = 2)`,
            [user_id]
        );

        // Outgoing: I sent someone a request
        const outgoing = await pgpool.query(
            `SELECT request_id, uid1, uid2, requestor, created_at
            FROM friend_requests
            WHERE (uid1 = $1 AND requestor = 2) OR (uid2 = $1 AND requestor = 1)`,
            [user_id]
        );

        return res.json({ incoming: incoming.rows, outgoing: outgoing.rows });
    } catch (err) {
        console.log('friendController.js: Error in listRequests', err);
        return res.status(500).json({ error: err.message });
    } 
};

exports.acceptRequest = async (req, res) => {

};

exports.rejectRequest = async (req, res) => {

};

exports.listFriends = async (req, res) => {

};

exports.deleteFriend = async (req, res) => {

};