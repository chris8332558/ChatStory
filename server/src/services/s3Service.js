require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// getSignedUrl is a utility from the presigner package that generates a temporary, signed URL for executing the command without needing AWS credentials on the client side
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.S3_BUCKET;

// key (the unique path/filename in the bucket, e.g., 'uploads/image.jpg')
// contentType (MIME type, e.g., 'image/jpeg' or 'video/mp4')
// TODO: Now the bucket is public access for easy use, need to change to private later
async function getPresignedUploadUrl({ key, content_type, expires_in = 60 * 5}) {
    console.log('s3Service.js: Start getPresignedUploadUrl()');
    const cmd = new PutObjectCommand({
        Bucket: BUCKET, // The target bucket
        Key: key, // The object's path in the bucket
        ContentType: content_type, // The MIME type
        // ACL: 'private', // Set the Access Control List to private, meaning the uploaded object isn't publicly accessible by default (requires authentication or signed URLs for access)
        // ACL: 'public-read', // Set the Access Control List to private, meaning the uploaded object isn't publicly accessible by default (requires authentication or signed URLs for access)
    });

    // Generates a presigned URL using the S3 client and command; this URL is a temporary link (valid for expiresIn seconds) 
    // that allows anyone with it to perform the PUT upload directly to S3 without AWS credentials.
    const upload_url = await getSignedUrl(s3, cmd, { expires_in }); 
    console.log(`s3Service.js: Got upload_url: ${upload_url}`)

    // mediaUrl: A permanent URL for the object after upload,
    // The encodeURIComponent(key) ensures special characters in the key are properly escaped
    // TODO: Use CDN (AWS CloudFront) for faster access to s3
    // Now there's no process.env.CDN_BASE_URL, so it uses the later http link
    const media_url = `${process.env.CDN_BASE_URL || `https://${BUCKET}.s3.amazonaws.com`}/${encodeURIComponent(key)}`;
    console.log(`s3Service.js: Got media_url: ${media_url}`)
    return { upload_url, media_url };
}

module.exports = { getPresignedUploadUrl };