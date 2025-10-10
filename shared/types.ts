export type StoryType = {
    _id: string,
    room_id: string,
    user_id: number,
    username: string,
    media_url: string,
    media_type: string, // e.g. image/jepg or video/mp4
    duration_ms: number,
    thumbnail_url: string | null,
    created_at: string,
    expires_at: string,
};

export type FriendProfileType = {
    user_id: string,
    username: string,
    // email: string,
    // created_at: string, // ISO string
    display_name: string,
    avatar_url: string,
};

export type JWTType = {
    id: number,
    username: string,
}