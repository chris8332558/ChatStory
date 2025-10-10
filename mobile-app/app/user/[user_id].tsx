import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from 'react';
import { StoryType, FriendProfileType } from '../../../shared/types';
import { Button, Alert, Text, View, Image, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { getUserProfile, getMutualActiveStories, getMutualArchiveStories } from "@/src/api/users";
import { deleteFriend } from "@/src/api/friends";
import StoryViewer from "@/src/components/StoryViewer";

export default function UserProfileScreen() {
    const { user_id } = useLocalSearchParams<{ user_id: string }>();
    const router = useRouter();

    const [ profile, setProfile ] = useState<FriendProfileType | null>(null);
    const [ activeStories, setActiveStories ] = useState<StoryType[]>([]);
    const [ archiveStories, setArchiveStories ] = useState<StoryType[]>([]);;
    const [ selectedStory, setSelectedStory ] = useState<StoryType | null>(null);

    // Initial load
    useEffect(() => {
        if (!user_id) return;
        getUserProfile(user_id).then(setProfile).catch(() => Alert.alert('Error', 'Could not find user profile'));
        getMutualActiveStories(user_id).then(setActiveStories);
        getMutualArchiveStories(user_id).then(setArchiveStories);
    }, [user_id]);

    const handleDeleteFriend = () => {
        Alert.alert('Delete Friend', `Are you sure you want to delete ${profile?.display_name} as a friend?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Delete', style: 'destructive', onPress: async() => {
                    try {
                        await deleteFriend(user_id);
                        Alert.alert('Success', 'Friend deleted');
                        router.back();
                    } catch {
                        Alert.alert('Error', 'Failed to delete friend');
                    }
                }},
            ]
        );
    };

    const renderStoryThumb = ({ item } : { item: StoryType }) => {
        const thumbSource = item.thumbnail_url ? { uri: item.thumbnail_url } : { uri: item.media_url}
        return (
            <TouchableOpacity onPress={() => router.push(`../profile/story/${item._id}`)} style={styles.thumbContainer}>
                <Image source={thumbSource} style={styles.thumbnail} />
            </TouchableOpacity>
        );
    };

    if (!profile) {
        return <Text>Loading...</Text>;
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <Button title="<" onPress={() => {router.back()}} />
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                <Text style={styles.username}>{profile.username}</Text>
                {/* <Text style={styles.email}>{profile.email}</Text> */}
                <TouchableOpacity onPress={handleDeleteFriend} style={styles.deleteButton}>
                    <Text style={styles.buttonText}>Delete Friend</Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeader}>Active Stories (in mutual rooms)</Text>
                <FlatList 
                    data={activeStories}
                    renderItem={renderStoryThumb}
                    keyExtractor={(item) => item._id}
                    horizontal
                />

                <Text style={styles.sectionHeader}>Archive Stories (in mutual rooms)</Text>
                <FlatList 
                    data={archiveStories}
                    renderItem={renderStoryThumb}
                    keyExtractor={(item) => item._id}
                    numColumns={3}
                />

                {selectedStory && (
                    <StoryViewer
                        story={selectedStory}
                        onBack={() => setSelectedStory(null)}
                        onGoToRoom={(room_id) => {
                            setSelectedStory(null); // Close the viewer
                            router.push(`/chat/${room_id}`);
                        }}
                    />
                )}
            </SafeAreaView>
        </SafeAreaProvider>
    )

}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    avatar: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 12 },
    username: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
    email: { fontSize: 16, color: 'gray', textAlign: 'center', marginBottom: 20 },
    deleteButton: { backgroundColor: '#FF3B30', padding: 10, borderRadius: 8, alignSelf: 'center', marginBottom: 20 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
    thumbContainer: { marginRight: 10 },
    thumbnail: { width: 80, height: 120, borderRadius: 8, backgroundColor: '#eee' },
});