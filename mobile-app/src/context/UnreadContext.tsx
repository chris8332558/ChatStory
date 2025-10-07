import { createContext, useRef, useMemo, useContext, useState, useCallback, useEffect } from "react";
import { io, Socket } from 'socket.io-client';
import { fetchUnreads, markRoomRead } from "../api/unreads";
import AuthContext from "./AuthContext"; // Read the JWT
import { preventAutoHideAsync } from "expo-router/build/utils/splash";

export type UnreadMap = Map<string, number>; // room_id -> unread count
type Ctx = {
    counts: UnreadMap;
    total: number;
    refresh: () => Promise<void>;
    markRead: (room_id: string) => Promise<void>;
    setRoomZero: (room_id: string) => void;
};

export const UnreadContext = createContext<Ctx>({
    counts: new Map<string, number>() as UnreadMap,
    total: 0,
    refresh: async () => {},
    markRead: async (room_id: string) => {},
    setRoomZero: (room_id: string) => {},
});


export function UnreadProvider({ children, socketUrl }: { children: React.ReactNode; socketUrl: string }) {
    const [counts, setCounts] = useState<Map<string, number>>(new Map());
    const socketRef = useRef<Socket | null>(null);
        const { userToken } = useContext(AuthContext); // We can get user id and user name from the userToken (user.id, user.username)

    const refresh = useCallback(async () => {
        console.log('UnreadContext: refreshing unread counts');
        const data = await fetchUnreads();
        const entries = data.map(r => [r.room_id, r.unread] as [string, number]);
        const newMap = new Map<string, number>(entries);
        // const map: Map<string, number> = new Map();
        // for (const r of data) {
        //     console.log(`UnreadContext: room_id: ${r.room_id}, unread: ${r.unread}`);
        //     map.set(r.room_id, r.unread);
        // } 
        console.log(`typeof newMap: ${typeof newMap}, newMap: ${JSON.stringify(Array.from(newMap.entries()))}`);
        console.log('Type of counts:', typeof counts, 'Is it a Map?', newMap instanceof Map);
        setCounts(newMap);
    }, []);

    const markRead = useCallback(async (room_id: string) => {
        await markRoomRead(room_id); // idempotent server call
        setCounts((prev) => {
            const newMap = new Map(prev);
            newMap.set(room_id, 0);
            return newMap;
        }); // optimistic UI update
    }, []);

    // zero locally without a server call.
    const setRoomZero = useCallback((room_id: string) => {
        setCounts((prev) => {
            const newMap = new Map(prev);
            newMap.set(room_id, 0);
            return newMap;
        }); // optimistic UI update
    }, []);

    // On mount, it calls refresh() and opens a Socket.IO client to socketUrl with WebSocket transport, 
    // storing the client in a ref so it persists across renders
    useEffect(() => {
        refresh();
        const s = io(socketUrl, { 
            transports: ['websocket'],
            auth: { token: userToken },
        });
        socketRef.current = s;
        s.on('roomUnreadBump', ({room_id}) => { 
            refresh(); 
            console.log(`UnreadContext: received roomUnreadBump for room_id: ${room_id}`);
        }); // light bump event
        return () => { s.disconnect(); socketRef.current = null; };
    }, [socketUrl, userToken, refresh]);

    // total is computed with useMemo by summing Object.values(counts), recalculating only when counts changes to avoid unnecessary work.
    const total = useMemo(() => {
        console.log(`UnreadContext: counts change`);
        const values = Array.from(counts.values());
        console.log(`UnreadContext: current counts values: ${values}`);
        return values.reduce((a, b) => a + b, 0);
    }, [counts]);

    useEffect(() => {
        console.log(`UnreadContext: total unread count: ${total}`);
    }, [total]);    

    return (
        <UnreadContext.Provider value={{ counts, total, refresh, markRead, setRoomZero }}>
            {children}
        </UnreadContext.Provider>
    );
}