import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useState } from 'react';
import { StoryType } from '../../../../shared/types';
import { listMyArchiveStories, getStoryById } from "../../../src/api/stories";
import { ActivityIndicator, Alert } from "react-native";
import AuthContext from '../../../src/context/AuthContext';
import StoryViewer from "@/src/components/StoryViewer";

// The story screen when tap the active or archive stories in room archive or user's profile
export default function ProfileStoryScreen() {
    const { user } = useContext(AuthContext);
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

    if (!story || !user) {
        return (
            <ActivityIndicator size="large" />
        )
    };

    return (
        <StoryViewer
            story={story}
            current_user_id={user.id}
            onBack={() => router.back()}
            onGoToRoom={(room_id) => router.push(`/chat/${room_id}`)}
        />
    )
}