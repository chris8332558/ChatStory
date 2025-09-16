import { listActiveStories } from "../../../src/api/stories";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";

import { Text, View, Image, StyleSheet, ActivityIndicator } from "react-native";

export type Story = {
    room_id: string,
    user_id: string,
    username: string,
    media_url: string,
    media_type: string, // e.g. image/jepg or video/mp4
    duration_ms: string,
    created_at: string,
    expires_at: string,
};

export default function RoomStories() {
    const { room_id } = useLocalSearchParams<{ room_id: string }>();
    const [ idx, setIdx ] = useState(0);
    const [ stories, setStories ] = useState<Story[]>([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const currentStory = stories[idx];

    // Setup stories when enter a room
    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!room_id) return;
            try {
                const data = await listActiveStories(room_id as string);
                if (mounted) {
                    setStories(data.reverse()); // oldest to newest
                }
            } catch (err) {
                // show fallback
            } finally {
                if (mounted) { setIsLoading(false); }
            }
        })();
        return () => { mounted = false; };
    }, [room_id]);

    // TODO: Auto advance for images

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size={'large'} /></View>
    }

    if (!currentStory) {
        return <View style={styles.center}><Text>No Active Stories.</Text></View>
    }

    return (
        <View style={styles.container}>
            <Image source={{ uri: currentStory.media_url }} style={StyleSheet.absoluteFill} resizeMode="cover"/>
            <View style={styles.header}>
                <Text style={styles.username}>{currentStory.username}</Text>
            </View>
        </View>
    )

};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    content: {
        flex: 1
    },
    header: {
        position: 'absolute',
        top: 44,
        left: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center'
    },
    username: {
        color: 'white',
    },
})