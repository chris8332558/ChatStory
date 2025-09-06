import apiClient from "./client";

export async function addUserToRoom(room_id: string, payload: { email: string }) {
    const res = await apiClient.post(`rooms/${room_id}/members`, payload);
    return res.data;
};

// TODO:
// export async function createInvite(room_id: string)
// export async function redeemInvite(token: string)