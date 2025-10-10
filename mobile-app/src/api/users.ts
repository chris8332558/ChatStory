import { StoryType } from "../../../shared/types";
import apiClient from "./client";

export type Me = {
    user_id: string,
    username: string,
    email: string,
    created_at: string, // ISO string
    display_name: string,
    avatar_url: string,
};

export async function getAvatarPresignedUrl(content_type: string) {
    const res = await apiClient.post('users/me/avatar/presigned-url', { content_type });
    console.log('users.ts: getAvatarPresignedUrl()');
    console.log('users.js: res.data: ', res.data);
    return res.data
};

export async function getMe() {
    const res = await apiClient.get('users/me');
    return res.data as Me;
};

// Pass any subset of those two fields (username and email), and eaxh is optaionl
export async function updateMe(patch: Partial<Pick<Me, 'username' | 'email' | 'display_name' | 'avatar_url'>>) {
    const res = await apiClient.patch('users/me', patch);
    return res.data as Me;
};

export async function getUserProfile(user_id: string) {
  const response = await apiClient.get(`/users/${user_id}`);
  return response.data;
}

export async function getMutualActiveStories(user_id: string): Promise<StoryType[]> {
  const response = await apiClient.get(`/users/${user_id}/stories/active`);
  return response.data;
}

export async function getMutualArchiveStories(user_id: string, before?: string): Promise<StoryType[]> {
  const response = await apiClient.get(`/users/${user_id}/stories/archive`, { params: { before } });
  return response.data;
}