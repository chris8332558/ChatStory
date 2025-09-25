const { getPresignedUploadUrl } = require('../services/s3Service');
const crypto = require('crypto');

exports.getAvatarPresigned = async (req, res) => {
    try {
        console.log(`avatarController.js: Start getAvatarPrefisnged()`);

        const user_id = req.user.id; // set in auth middleware
        const { content_type } = req.body;

        // crypto: Node.js built-in module for generating random bytes, used here to create unique file names to avoid collisions
        // extract the file extension from content_type (e.g. 'jpeg' from 'image/jpeg')
        // key: A unique s3 key to be used as the object path
        const ext = content_type.includes('/') ? content_type.split('/')[1] : 'bin';
        const key = `users/${user_id}/avatar/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

        const { upload_url, media_url } = await getPresignedUploadUrl({ key, content_type });
        console.log('avatarController.js: Received uplaod_url and media_url from s3Service.js');
        console.log('upload_url', upload_url);
        console.log('media_url', media_url);
        return res.json({ upload_url, media_url });
    } catch (err) {
        console.error('avatarController.js: getAvatarPresigned error: ', err)
        return res.status(500).json({ message: 'avatarController.js: Server error' });
    }
};