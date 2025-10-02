import apiClient from './client';

export type UnreadItem = { room_id: string; unread: number };

export async function fetchUnreads(): Promise<UnreadItem[]> {
    const res = await apiClient.get('/unreads');
    return res.data;
}

export async function markRoomRead(room_id: string): Promise<void> {
    await apiClient.patch(`/unreads/rooms/${room_id}/read`);
}

export async function markStoriesSeen(room_id: string): Promise<void> {
    await apiClient.patch(`/unreads/stories/rooms/${room_id}/seen`);
}