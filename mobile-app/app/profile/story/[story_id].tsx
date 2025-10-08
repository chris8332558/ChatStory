import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from 'react';
import { StoryType } from '../../../../shared/types';
import { listMyArchiveStories } from "../../../src/api/stories";
import { Alert } from "react-native";
import StoryViewer from "@/src/components/StoryViewer";

export default function ProfileStoryScreen() {
    const { story_id } = useLocalSearchParams<{ story_id: string }>();
    const router = useRouter();
    const [story, setStory] = useState<StoryType | null>();

    useEffect(() => {
        console.log(`[story_id].tsx: story_id=${story_id}`);
        listMyArchiveStories(new Date().toISOString(), 50).then((stories) => {
            const found = stories.find((s) => s._id === story_id);
            if (found) setStory(found);
            else {
                Alert.alert('Story Not Found', 'Story not found in your archive')
                router.back();
            }
        }).catch(() => Alert.alert('Error', 'Failed to load story data.'));
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