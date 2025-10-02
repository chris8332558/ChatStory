import { useEffect, useContext, useState, useMemo } from "react";
import { io, Socket } from 'socket.io-client';
import apiClient from "../api/client";
import { fetchUnreads } from "../api/unreads";
import AuthContext from "../../src/context/AuthContext"; // Read the JWT


export type Map = Record<string, number>;

// Implement a reusable hook that loads unread counts, listens to roomUnreadBump over Socket.IO, 
// and exposes a local map for fast lookups and tab badge rendering, which matches real-time UI patterns for counters and badges
export function useUnreads(SOCKET_URL: string) {
    const [counts, setCounts] = useState<Map>({});
    const [socket, setSocket] = useState<Socket | null>(null);
    const { userToken } = useContext(AuthContext); // We can get user id and user name from the userToken (user.id, user.username)


    const load = async () => {
        const data = await fetchUnreads();
        const map: Map = {};
        for (const r of data) {
            map[r.room_id] = r.unread;
        } 
        setCounts(map);
    }

    useEffect(() => {
        let mounted = true;
        load();
        const s = io(SOCKET_URL, { 
            transports: ['websocket'],
            auth: { token: userToken } 
        });
        setSocket(s);
        // Refreshing on a lightweight bump event is robust and avoids duplicating unread math on the client, while still delivering fast badge updates across the app
        s.on('roomUnreadBump', (room_id) => { if (mounted) load(); });
        return () => { mounted = false; s.disconnect(); };
    }, [SOCKET_URL]);

    const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

    return { counts, total, refresh: load, socket };
}