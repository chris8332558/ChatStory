export type StoryType = {
    _id: string,
    room_id: string,
    user_id: string,
    username: string,
    media_url: string,
    media_type: string, // e.g. image/jepg or video/mp4
    duration_ms: number,
    thumbnail_url: string | null,
    created_at: string,
    expires_at: string,
};