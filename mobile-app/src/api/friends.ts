import apiClient from "./client";

export async function listFriends() {
    const res = await apiClient.get('friends');
    return res.data as { user_id: string, username: string, display_name: string, avatar_url: string }[];
}

export async function listRequests() {
    const res = await apiClient.get('friends/requests');
    return res.data as { incoming: any[], outgoing: any[] };
}

export async function sendRequest(opts: {to_user_id?: string, email?: string, username?: string}) {
    console.log('friends.ts: sendRequest with opts:', opts);
    const res = await apiClient.post('friends/requests', opts);
    return res.data;
}

export async function acceptRequest(request_id: string) {
    const res = await apiClient.post(`friends/requests/${request_id}/accept`);
    return res.data;
}

export async function rejectRequest(request_id: string) {
    const res = await apiClient.post(`friends/requests/${request_id}/reject`);
    return res.data;
}

export async function deleteFriend(friend_id: string) {
    const res = await apiClient.delete(`friends/${friend_id}`);
    return res.data;
}