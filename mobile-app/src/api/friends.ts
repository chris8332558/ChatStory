import apiClient from "./client";

export async function listFriends() {
    const res = await apiClient.get('friends');
    return res.data as { user_id: string, username: string, display_name: string, avatar_url: string }[];
}

export async function listRequests() {
    const res = await apiClient.get('friends/requests');
    return res.data as { incoming: any[], outgoing: any[] };
}

export async function sendRequest(to_user_id: string) {
    const res = await apiClient.post('friends/requests', { to_user_id });
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