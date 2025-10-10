import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { StoryType } from '../../../../shared/types';
import { listMyArchiveStories, getStoryById } from "../../../src/api/stories";
import { Alert } from "react-native";
import StoryViewer from "@/src/components/StoryViewer";

// The story screen when tap the active or archive stories in room archive or user's profile
export default function ProfileStoryScreen() {
    const { story_id } = useLocalSearchParams<{ story_id: string }>();
    const router = useRouter();
    const [story, setStory] = useState<StoryType | null>();

    useEffect(() => {
        (async() => {
            console.log(`[story_id].tsx: story_id=${story_id}, typeof: ${typeof story_id}`);
            try {
                const found = await getStoryById(story_id);
                if (found) setStory(found);
                else {
                    Alert.alert('Story Not Found', 'Story not found in your archive')
                    router.back();
                }
            } catch (err: any) {
                Alert.alert('Error', 'Failed to load story data.', err);
                router.back();
            }
        })();
    }, [story_id]);

    if (!story) return null;

    return (
        <StoryViewer
            story={story}
            onBack={() => router.back()}
            onGoToRoom={(room_id) => router.push(`/chat/${room_id}`)}
        />
    )
}