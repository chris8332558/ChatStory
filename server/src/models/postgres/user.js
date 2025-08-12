const { pgPool } = require('../../config');
const bcrypt = require('bcryptjs');

// This object acts as a container for all the functions (or methods) that relate to user data.
const User = {
    // Instead of writing raw SQL queries all over your application, 
    // you can just call the functions defined here (e.g., User.create(...)).
    async create({ username, email, password }) {
        // The salt prevents common password attacks.
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await pgPool.query(
            'INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3) \
            RETURNING user_id, username, email',
            [username, email, password_hash]
        );
        return result.rows[0];
    },

    // If no user with that email exists, result.rows will be an empty array, 
    // and this function will return undefined, which is the correct behavior.
    async findByEmail(email) {
        const result = await pgPool.query('SELECT * FROM Users WHERE email = $1', [email]);
        return result.rows[0];
    },
};

module.exports = User;