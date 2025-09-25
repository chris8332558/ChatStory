const { pgPool } = require('../config/index');

exports.getMe = async (req, res) => {
    const client = await pgPool.connect();
    const user_id = req.user.id; // set in auth middleware

    try { 
        console.log('userController.js: Start getMe()');
        // Probly don't need this, because this only get the data, not put
        await client.query('BEGIN');
        const r = await client.query(
            'SELECT user_id, username, email, created_at, display_name, avatar_url FROM Users WHERE user_id = $1',
            [user_id]
        );
        if (r.rowCount == 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await client.query('COMMIT')
        console.log(`userController.js: Finish getMe(): ${r.rows[0]}`);
        return res.json(r.rows[0]);

    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.updateMe = async (req, res) => {
    console.log('userController.js: Start updateMe()');
    try {
        const user_id = req.user.id;
        const { username, email, display_name, avatar_url } = req.body; // Patch: partial fields
        console.log(`userController.js: username: ${username}, avatar_url: ${avatar_url}`);
        const fields = [];
        const values = [];
        let i = 1;

        if (username != undefined) { fields.push(`username = $${i++}`); values.push(username)};
        if (email != undefined) { fields.push(`email = $${i++}`); values.push(email)};
        if (display_name != undefined) { fields.push(`display_name = $${i++}`); values.push(display_name)};
        if (avatar_url != undefined) { fields.push(`avatar_url = $${i++}`); values.push(avatar_url)};

        if (fields.length === 0) return res.status(400).json({ message: 'No changes provided '});

        values.push(user_id);

        // 'UPDATE Users SET username, email WHERE user_id = 1 RETURN user_id, username, email, created_at';
        const sql = `UPDATE Users SET ${fields.join(', ')} WHERE user_id = $${i} RETURNING user_id, username, email, created_at, display_name, avatar_url`;
        const r = await pgPool.query(sql, values);
        return res.json(r.rows[0]);
    } catch (err) {
        console.error('userController.js: updateMe error: ', err);
        return res.status(500).json ({ message: 'Server error when updateMe' });
    }
};