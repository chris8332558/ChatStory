const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendBatch(notifications) {
    const chunks = expo.chunkPushNotifications(notifications);
    for (const chunk of chunks) {
        try {
            const tickets = await expo.sendPushNotificationsAsync(chunk);
            console.log('Push notification tickets:', tickets);
        } catch (error) {
            console.error('Error sending push notifications:', error);
        }
    }
}

module.exports = { sendBatch };

// This file defines a worker function sendBatch that takes an array of push notification messages and sends them in batches using the Expo SDK.
// It chunks the notifications into manageable sizes and sends each chunk, logging the results or any errors encountered.