import apiClient from "./client";
import { StoryType } from "../../../shared/types";

export async function getPresignedUrl(room_id: string, content_type: string) {
    const res = await apiClient.post('/stories/presigned-url', { room_id, content_type });
    console.log('stories.ts: getPresignedUrl()');
    console.log('stories.js: res.data: ', res.data);
    // return res.data as { upload_url: string; media_url: string };
    return res.data
};

export async function createStory(payload: {
    room_id: string;
    media_url: string;
    media_type: string;
    duration_ms?: number;
    thumbnail_url?: string;
}) {
    const res = await apiClient.post('/stories', payload);
    return res.data;
};

export async function getStoryById(story_id: string) {
    const res = await apiClient.get(`/stories/${story_id}`);
    return res.data as StoryType;
};

export async function listActiveStories(room_id: string) {
    const res = await apiClient.get(`/stories/rooms/${room_id}/active`);
    return res.data as StoryType[];
};

export async function listArchiveStories(room_id: string, before: string, limit = 50) {
    const res = await apiClient.get(`/stories/rooms/${room_id}/archive`, { params: { before, limit }});
    return res.data as StoryType[];
};

export async function listMyActiveStories() {
    const res = await apiClient.get(`/stories/me/active`);
    return res.data as StoryType[];
};

export async function listMyArchiveStories(before: string, limit = 50) {
    const res = await apiClient.get(`/stories/me/archive`, { params: { before, limit }});
    return res.data as StoryType[];
};