// Pseudo-queue; replace with Redis-backed queue in production
const jobs = [];
function enqueuePush(notification) { 
    json.push(notification); 
}

async function drain(expo) {
    if (jobs.length === 0) return;
    const batch = jobs.splice(0, jobs.length);
    const chunks = expo.chunkPushNotifications(batch);
    for (const c of chunks) {
        try { 
            await expo.sendPushNotificationsAsync(c); 
        } catch (err) { 
            console.error('pushQueue: drain error sending push', err);
        }
    }
}

module.exports = { enqueuePush, drain };