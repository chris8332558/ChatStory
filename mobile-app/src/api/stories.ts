import apiClient from "./client";

export async function getPresignedUrl(room_id: string, content_type: string) {
    const res = await apiClient.post('/stories/presigned-url', { room_id, content_type });
    return res.data as { upload_url: string; media_url: string };
};

export async function createStory(payload: {
    room_id: string;
    media_url: string;
    media_type: string;
    duration_ms?: number;
}) {
    const res = await apiClient.post('/stories', payload);
    return res.data;
};

export async function listActiveStories(room_id: string) {
    const res = await apiClient.get(`/stories/rooms/${room_id}/active`);
    return res.data;
};

export async function listArchiveStories(room_id: string, before?: string, limit = 50) {
    const res = await apiClient.get(`/stories/rooms/${room_id}/archive`, { params: { before, limit }});
    return res.data;
};