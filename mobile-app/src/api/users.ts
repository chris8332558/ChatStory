import apiClient from "./client";

export type Me = {
    user_id: string,
    username: string,
    email: string,
    created_at: string, // ISO string
}

export async function getMe() {
    const res = await apiClient.get('users/me');
    return res.data as Me;
};

// Pass any subset of those two fields (username and email), and eaxh is optaionl
export async function updateMe(patch: Partial<Pick<Me, 'username' | 'email'>>) {
    const res = await apiClient.patch('users/me', patch);
    return res.data as Me;
};