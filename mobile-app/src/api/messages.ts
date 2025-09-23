import apiClient from './client';

export type MessageType = {
    _id: string;
    room_id: string;
    user_id: string;
    username: string;
    text: string;
    created_at: string;
};

export async function fetchRoomMessages(room_id: string, limit = 50) {
    console.log('messages: fetchRoomMessages with room_id:', room_id);
    const res = await apiClient.get(`rooms/${room_id}/messages`, {
        params: { limit, before : new Date().toISOString() }, 
    });

    // return list of Message type defined in [room_id].tsx?
    return res.data as MessageType[];
}

export async function postRoomMessage(room_id: string, text: string) {
    const res = await apiClient.post(`rooms/${room_id}/messages`, { text });
    return res.data;
}