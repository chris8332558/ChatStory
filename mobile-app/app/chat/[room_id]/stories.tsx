import { useEvent } from "expo";
import { listActiveStories } from "../../../src/api/stories";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState, useEffect, useCallback } from "react";
import ui from "../../../src/ui/shared";

import { Text, View, Button, Image, StyleSheet, ActivityIndicator, TouchableWithoutFeedback, Dimensions, Alert } from "react-native";

const { height, width} = Dimensions.get('screen');

export type Story = {
    room_id: string,
    user_id: string,
    username: string,
    media_url: string,
    media_type: string, // e.g. image/jepg or video/mp4
    duration_ms: number,
    created_at: string,
    expires_at: string,
};

export default function RoomStories() {
    const { room_id } = useLocalSearchParams<{ room_id: string }>();
    const [ idx, setIdx ] = useState(0);
    const [ stories, setStories ] = useState<Story[]>([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const currentStory = stories[idx];
    const isVideo = !!currentStory && currentStory.media_type.startsWith('video/');

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
                Alert.alert('Error', 'Failed to get stories');
                console.error('stories.tsx: listActiveStories error: ', err);
            } finally {
                if (mounted) { setIsLoading(false); }
            }
        })();
        return () => { mounted = false; };
    }, [room_id]);

    // Auto advance
    const onNext = useCallback(() => {
        if (idx < stories.length - 1) {
            setIdx(i => i + 1);
        } else {
            router.back();
        }
    }, [idx, stories.length]);
    
    const onPrev = () => {
        if (idx > 0) {
            setIdx(i => i - 1);
        }
    };

    useEffect(() => {
        if (!currentStory) return;
        if (currentStory.media_type.startsWith('image/')) {
            const t = setTimeout(() => {
                onNext();
            }, currentStory.duration_ms || 5000);
            return () => clearTimeout(t);
        }
    }, [currentStory, onNext]);


    const player = useVideoPlayer(currentStory?.media_url ?? null, (player) => {
        player.loop = false;
        player.play();
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    useEffect(() => {
        if (!isVideo) return;
        const duration = player.duration ?? 0;
        const currentTime = player.currentTime ?? 0;
        if (!isPlaying && duration > 0 && currentTime >= duration - 0.25) {
            onNext();
        }
    }, [isPlaying, player.currentTime, player.duration, isVideo, onNext]);

    if (isLoading) {
        return <View style={styles.center}><ActivityIndicator size={'large'} /></View>
    }

    if (!currentStory) {
        console.log("stories.tsx: No Active Stories");
        return (
        <View style={styles.center}>
            <View style={styles.header}>
                <Button title="Back" onPress={() => router.back() } />
                <Text style={{flex: 1, color: 'black'}}>No Active Stories.</Text>
            </View>
        </View>
        )
    }
    else {
        console.log(`stories.tsx: setStories(), ${idx+1}/${stories.length}`);
        console.log('sotries.tsx: currentStory: ', currentStory);
    }


    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback onPress={(e) => {
                const x = e.nativeEvent.locationX;
                if (x < width / 2) onPrev(); else onNext();
            }}>
                <View style={styles.content}>
                    {isVideo ? (
                        <VideoView 
                            style={styles.video}
                            player={player}
                            contentFit='contain'
                        />
                    ) : (
                        <Image source={{ uri: currentStory.media_url }} style={StyleSheet.absoluteFill} resizeMode="contain"/>
                    )}
                    <View style={styles.header}>
                        <Button title="Back" onPress={() => router.back() } />
                        <Text style={styles.username}>{currentStory.username}</Text>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </View>
    );
};

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ui.colors.bg
    },
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    content: {
        flex: 1,
    },
    video: {
        height: height,
        width: width
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
        fontWeight: '700',
        fontSize: 16,
    },
})