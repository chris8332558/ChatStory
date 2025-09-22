import { listArchiveStories } from "../../../src/api/stories";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { View, Text, Button, Alert, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import ui from '../../../src/ui/shared';

export default function StoriesArchive() {
    const { room_id } = useLocalSearchParams<{ room_id: string }>();
    const [done, setDone] = useState(false);
    const [cursor, setCursor] = useState<string>((new Date()).toString());
    const [archives, setArchives] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    

    const load = useCallback(async () => {
        console.log(`stories-archive.tsx: start load()`);
        if (!room_id || done) {
            console.log(`stories-archive.tsx: done: ${done}`);
            return;
        }
        if (isLoading) return;
        setIsLoading(true);
        try {
            console.log(`stories-archive.tsx: load(): cursor=${cursor}`);
            const data = await listArchiveStories(room_id as string, cursor, 6);
            console.log(`stories-archive.tsx: Get archive stories: ${data.length}`);
            console.log(`stories-archive.tsx: cursor: ${cursor}`);
            setArchives(prev => [...prev, ...data]);
            if (data.length > 0) {
                setCursor(data[data.length - 1].created_at);
            } else {
                setDone(true);
            }
        } catch (err) {
            console.error('stories-archive.tsx: load archive error: ', err);
            Alert.alert('Error', 'Failed to load arhive');
        } finally {
            setIsLoading(false);
        }
    }, [cursor, room_id, isLoading, done]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{flex: 1}}>
                <View>
                    <Button title="<" onPress={() => router.back()} />
                </View>
                <FlatList 
                    data={archives}
                    numColumns={3}
                    keyExtractor={(item) => item._id?.toString() || `${item.created_at}-${item.user_id}`}
                    renderItem={({item}) => (
                        <TouchableOpacity 
                            style={styles.cell} 
                            onPress={() => router.push(`/chat/${room_id}/stories`)}
                        >
                            <Image source={{uri: item.media_url }} style={styles.thumb} />
                        </TouchableOpacity>
                    )}
                    onEndReachedThreshold={0.6}
                    onEndReached={load}
                    ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
                    ListEmptyComponent={!isLoading ? <Text style={{ textAlign: 'center', marginTop: 24 }}>Empty Stroy Archive</Text> : null}
                />          
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    cell: {
        width: '33.33%',
        aspectRatio: 1,
        padding: 1,
    },
    thumb: {
        flex: 1,
        backgroundColor: ui.colors.bg,
    }
});
