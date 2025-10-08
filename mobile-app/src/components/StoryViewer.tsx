import { StoryType } from "../../../shared/types";
import { useEffect, useRef, useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import { Text, View, Button, Image, StyleSheet, ActivityIndicator, TouchableWithoutFeedback, Dimensions, Alert, TouchableOpacity, Touchable } from "react-native";
import ui from "../../src/ui/shared";
import * as MediaLibrary from 'expo-media-library';
// import * as FileSystem from 'expo-file-system';
import { File, Directory, Paths } from 'expo-file-system';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

type StoryViewerProps = {
    story: StoryType;
    onBack : () => void;
    onGoToRoom: (room_id: string) => void;
};


export default function StoryViewer({ story, onBack , onGoToRoom }: StoryViewerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const isVideo = story.media_type.startsWith('video/');
    const player = useVideoPlayer(story?.media_url ?? null, (player) => {
        player.loop = false;
        player.play();
    });

    useEffect(() => {
        console.log(`StoryViewer.tsx: story.room_id=${story._id}`);
    });

    const downloadStory = async () => {
        const destination = new Directory(Paths.cache, 'stories');
        try {
            setIsLoading(true);

            const perm = await MediaLibrary.requestPermissionsAsync();
            if (perm.status !== 'granted') {
                Alert.alert('Permission Required', 'Media library access is required');
                return;
            }
            
            destination.create();
            const output = await File.downloadFileAsync(story.media_url, destination);
            console.log(`StoryViewer: Is filed downloaded: ${output.exists}`);
            console.log(`StoryViewer: file uri: ${output.uri}`);


        } catch (err: any) {
            Alert.alert('Download Failed', err.message || 'Check your network and permission')
        } finally {
            setIsLoading(false);
        }
    }


    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                {isVideo ? (
                    <VideoView 
                        style={styles.media}
                        player={player}
                        contentFit='contain'
                    />
                ) : (
                    <Image source={{ uri: story.media_url }} style={StyleSheet.absoluteFill} resizeMode="contain"/>
                )}
            </SafeAreaView>
            <View style={styles.infoRow}>
                <Text style={styles.username}>{story.username || 'Unknown user'}</Text>
            </View>
            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    onPress={downloadStory}
                    style={[styles.button, isLoading ? styles.buttonDisabled : null ]}
                    disabled={isLoading}
                >

                    {isLoading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>Download</Text>}
                </TouchableOpacity>

                {story.room_id && (
                    <TouchableOpacity onPress={() => onGoToRoom(story.room_id)} style={styles.button}>
                        <Text style={styles.buttonText}>Go To Room</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={onBack} style={styles.button}>
                    <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
    media: { width: '100%', height: '75%' },
    infoRow: { position: 'absolute', top: 40, left: 20 },
    username: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    buttonsRow: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '90%',
    },
    button: { backgroundColor: '#1e40af', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 6 },
    buttonText: { color: 'white', fontWeight: '600' },
    buttonDisabled: { opacity: 0.5 },
});