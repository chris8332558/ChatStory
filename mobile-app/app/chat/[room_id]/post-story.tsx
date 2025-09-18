import { router, useLocalSearchParams } from "expo-router";
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from "react-native"
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import { createStory, getPresignedUrl } from "../../../src/api/stories";

export default function PostStory() {
    const { room_id } = useLocalSearchParams<{ room_id: string }>();
    const [isLoading, setIsLoading] = useState(false);

    const pickAndUpload = async () => {
        if (!room_id) {
            Alert.alert("Error", "Missing room id");
            return;
        }

        // Get access to the local media library
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
            Alert.alert('Permission Required', 'Media library access is required');
            return;
        }

        // Choose the media
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos', 'livePhotos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (result.canceled) return;
        console.log('post-story.tsx: Succefully picked a image');

        const asset = result.assets[0];
        const uri = asset.uri;
        const isVideo = (asset.type || '').includes('video') || (asset.duration && asset.duration > 0);
        console.log('post-story.tsx: asset: ', asset);
        console.log('post-story.tsx: isVideo: ', isVideo);
        // TODO: the type is wrong now (image becomes .mp4)
        const content_type = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');
        console.log('post-story.tsx: content_type: ', content_type);


        setIsLoading(true);
        try {
            // 1. Get presigned url
            const { upload_url, media_url } = await getPresignedUrl(room_id as string, content_type);
            console.log('post-story.tsx: Successfully getPresignedUrl');
            console.log('post-story.tsx: upload_url: ', upload_url);
            console.log('post-story.tsx: media_url: ', media_url);

            // 2. Upload file to s3 with PUT
            // Retrieve the local file. fileResp is a response object containing the file data
            const fileResp = await fetch(uri);
            // Convert the object into a Blob object, which represent the raw file data in a format suitable for upload (e.g. binary data)
            const blob = await fileResp.blob();
            const put = await fetch(upload_url, {
                method: 'PUT',
                headers: { 'Content-Type': content_type },
                body: blob,
            });
            if (!put.ok) {
                throw new Error("Upload to s3 failed");
            }
            console.log('post-story.tsx: Successfully upload file to s3');

            // 3. Create story
            console.log('post-story.tsx: Start createStory()');
            await createStory({
                room_id: room_id as string,
                media_url: media_url,
                media_type: content_type,
                duration_ms: !isVideo ? 5000 : 0,
            });

            Alert.alert('Success', 'Story posted');
            router.back(); // Go back to the last screen
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to upload story');
            console.error('post-story.tsx: pickAndUpload error: ', err);
        } finally {
            setIsLoading(false);
        }
    }

    return (
    <View style={styles.container}>
        <Button title='back' onPress={() => router.back()} />
        { isLoading ? (
            <>
            <ActivityIndicator size='large' />
            <Text style={ styles.uploadingText }>Uploading...</Text>
            </>
        ) : (
            <Button title='Pick media and post story' onPress={pickAndUpload} />
        ) }
    </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    uploadingText: {
        marginTop: 12,
    }
})