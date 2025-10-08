import apiClient from "./client";

export type RoomType = {
    room_id: string;
    name: string;
};

export async function getUserRooms() {
    const res = await apiClient.get('/rooms');
    return res.data as RoomType[];
}

export async function getRoomByRoomId(room_id: string) {
    const res = await apiClient.get(`/rooms/${room_id}`);
    return res.data;
}