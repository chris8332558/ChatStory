const { Expo } = require('expo-server-sdk');
const { pgPool } = requrie('../config');

// Register a device's Expo push token
// POST /api/devices/register
// Body: { expo_push_token, platform, appVersion }
// Headers: { x-auth-token: <JWT> }
exports.registerToken = async (req, res) => {
    const user_id = req.user.id;
    const { expo_push_token, platform, appVersion } = req.body; // from client

    if (!expo_push_token || !Expo.isExpoPushToken(expo_push_token)) {
        return res.status(400).json({ message: 'Invalid Expo push token' });
    }

    await pgPool.query(
        `INSERT INTO Devices (user_id, expo_push_token, platform, app_version, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        On CONFLICT (expo_push_token)
        DO UPDATE SET user_id = EXFLUDED.user_id, platform = EXCLUDED.platform, app_version = EXCLUDED.app_version, updated_at = NOW()`,
        [user_id, expo_push_token, platform || null, appVersion || null]
    );
    return res.status(204).send();
};