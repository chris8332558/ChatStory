import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { StoryType } from '../../../../../shared/types';
import { listArchiveStories } from "@/src/api/stories";
import { Alert } from "react-native";
import StoryViewer from "@/src/components/StoryViewer";

export default function RoomArchiveStoryScreen() {
    const { room_id, story_id } = useLocalSearchParams<{ room_id: string; story_id: string }>();
    const router = useRouter();
    const [story, setStory] = useState<StoryType | null>();

    useEffect(() => {
        if (!room_id) return;
        listArchiveStories(room_id, new Date().toISOString()).then((stories) => {
            const found = stories.find((s) => s._id === story_id);
            if (found) setStory(found);
            else {
                Alert.alert('Story Not Found', 'Story not found in your archive')
                router.back();
            }
        }).catch (() => Alert.alert('Error', 'Failed to load story data.'));
    }, [room_id, story_id]);

    if (!story) return null;

    return (
        <StoryViewer
            story={story}
            onBack={() => router.back()}
            onGoToRoom={(room_id) => router.push(`/chat/${room_id}`)}
        />
    )
};