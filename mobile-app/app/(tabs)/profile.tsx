import React, { useState, useContext, useEffect } from "react";
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { View, Button, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AuthContext from '../../src/context/AuthContext';
import { getMe, Me, updateMe, getAvatarPresignedUrl } from "../../src/api/users";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { listMyActiveStories, listMyArchiveStories } from "../../src/api/stories";
import { StoryType } from "../../../shared/types";
import ui from '../../src/ui/shared';

export default function ProfileScreen() {
    const [me, setMe] = useState<Me | null>(null);
    const [form, setForm] = useState<Partial<Me>>({});
    const [saving, setSaving] = useState(false);
    const [active, setActive] = useState<StoryType[]>([]);
    const [archive, setArchive] = useState<StoryType[]>([]);
    const [archiveCursor, setArchiveCursor] = useState<string>(new Date().toISOString());
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveDone, setArchiveDone] = useState(false);
    const [updatingAvatar, setUpdatingAvatar] = useState(false);

    const router = useRouter(); 
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        (async () => {
            try {
                const u = await getMe();
                console.log(`profile.tsx: getMe(), avatar_url: ${u.avatar_url}`);
                setForm({ username: u.username, email: u.email, display_name: u.display_name, avatar_url: u.avatar_url });
            } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to load profile');
            }
        })();
    }, []);

    useEffect(() => {
        console.log('profile.tsx: avatar_url updated:', form.avatar_url);
    }, [form.avatar_url]);


    useEffect(() => {
        (async () => {
            try {
                const s = await listMyActiveStories();
                console.log(`profile.tsx:listMyActiveStories(): ${s.length}`);
                setActive(s);
            } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to load my active');
            }
        })();
    }, []);

    const loadMoreArchive = async () => {
        if (archiveLoading || archiveDone) return;

        setArchiveLoading(true);
        try {
            const page = await listMyArchiveStories(archiveCursor, 30);
            setArchive(prev =>[...prev, ...page]);
            if (page.length > 0) {
                setArchiveCursor(new Date(page[page.length-1].created_at).toISOString());       
            } else {
                setArchiveDone(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to load more archive');
        } finally {
            setArchiveLoading(false);
        }
    };

    const onChangeAvatar = async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is required');
        } 

        const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            mediaTypes: ['images'],
            aspect: [1, 1],
        });

        if (result.canceled) return;
        console.log('profile.tsx: Succefully picked a image');

        const asset = result.assets[0];
        const uri = asset.uri;
        console.log('post-story.tsx: asset: ', asset);
        const content_type = asset.mimeType || 'image/jpeg';
        console.log('post-story.tsx: content_type: ', content_type);
        
        setUpdatingAvatar(true);
        try {
            // 1. Get avatar presigned url
            const { upload_url, media_url }= await getAvatarPresignedUrl(content_type);
            console.log('profile.tsx: Successfully getPresignedUrl');
            console.log('profile.tsx: upload_url: ', upload_url);
            console.log('profile.tsx: media_url: ', media_url);

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
            console.log('profile.tsx: Successfully upload file to s3');

            const nextForm = { ...form, avatar_url: media_url };
            setForm(nextForm);
            const updated = await updateMe({
                username: nextForm.username,
                email: nextForm.email,
                display_name: nextForm.display_name,
                avatar_url: nextForm.avatar_url,
            });

            setMe(updated);
            Alert.alert('Saved', 'Profile updated');
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to udpate profile');
        } finally {
            setUpdatingAvatar(false);
        }
    };

    const onSave = async() => {
        setSaving(true);
        try {
            const updated = await updateMe({
                username: form.username,
                email: form.email,
                display_name: form.display_name,
                avatar_url: form.avatar_url,
            });
            setMe(updated);
            Alert.alert('Saved', 'Profile updated');
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to udpate profile');
        } finally {
            setSaving(false);
        }
    };

    const renderActiveThumb = ({ item } : { item: StoryType }) => {
        const thumbSource = item.thumbnail_url ? { uri: item.thumbnail_url } : { uri: item.media_url}
        return (
                <TouchableOpacity onPress={() => router.push(`../profile/story/${item._id}`)} style={styles.activeCell}>
                    <Image source={thumbSource} style={styles.storyThumb} />
                </TouchableOpacity>
        );
    };

    const renderArchiveThumb = ({ item } : { item: StoryType }) => {
        const thumbSource = item.thumbnail_url ? { uri: item.thumbnail_url } : { uri: item.media_url}
        return (
                <TouchableOpacity onPress={() => router.push(`../profile/story/${item._id}`)} style={styles.archiveCell}>
                    <Image source={thumbSource} style={styles.storyThumb} />
                </TouchableOpacity>
        );
    };

    const handleLogout = async () => {
        await logout();
        console.log('profile: logout');
        router.replace('/login') // Go to the index.tsx screen
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <FlatList 
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onChangeAvatar} style={{ alignSelf: 'center', marginBottom: 12 }}>
                                {updatingAvatar ? (
                                        <ActivityIndicator size='large' style={{ flex: 1 }} />
                                    ): (
                                        <Image 
                                            source={form?.avatar_url ? { uri: form.avatar_url} : require('../../assets/images/Avatar_Placeholder.png') }
                                            style={{ width: 96, height: 96, borderRadius: 48 }}
                                        />
                                    )
                                }
                            </TouchableOpacity>

                            <View style={styles.formRow}>
                                <Text style={styles.label}>Username</Text>
                                <Text style={styles.constant}>{form.username}</Text>
                            </View>

                            <View style={styles.formRow}>
                                <Text style={styles.label}>Email</Text>
                                <Text style={styles.constant}>{form.email}</Text>
                            </View>

                            <View style={styles.formRow}>
                                <Text style={styles.label}>Name</Text>
                                <View style={{flexDirection: 'row'}}>
                                    <TextInput style={[styles.input, {flex: 2}]} value={form.display_name || ''} onChangeText={(t) => setForm(s => ({ ...s, display_name: t }))} />
                                    <Button title={saving ? 'Saving...' : 'Save'} onPress={onSave} disabled={saving} />
                                </View>
                            </View>


                            <TouchableOpacity onPress={() => router.push('/setting')}>
                                <Text style={styles.link}>Setting</Text>
                            </TouchableOpacity>

                            <Text style={styles.section}>Active Stories</Text>

                            { active.length === 0 ? (
                                <Text>No active stories.</Text>
                            ) : (
                                <FlatList 
                                    data={active}
                                    horizontal={true}
                                    keyExtractor={(item) => item._id?.toString() || `${item.created_at}-${item.user_id}`}
                                    renderItem={renderActiveThumb}

                                />
                            )}

                            <Text style={styles.section}>Archive Stories</Text>
                        </View>
                    }

                    data={archive}
                    keyExtractor={(item) => item._id?.toString() || `${item.created_at}-${item.user_id}`}
                    numColumns={3}
                    renderItem={renderArchiveThumb}
                    onEndReachedThreshold={0.6}
                    onEndReached={loadMoreArchive}
                    ListFooterComponent={archiveLoading ? <ActivityIndicator style={{ margin: 12 }} /> : null}
                    contentContainerStyle={{ padding: 12 }}
                />
                <Button title='Log out' onPress={handleLogout} />
            </SafeAreaView>
        </SafeAreaProvider>
    )
};




const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', },
    header: { paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
    formRow: { marginBottom: 10 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    constant: {paddingVertical: 10, height: 40, fontSize: 20, fontWeight: '700' },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, height: 40, backgroundColor: 'white'},
    link: { color: '#1e40af', marginTop: 4},
    section: { fontWeight: '700', marginTop: 12, marginBottom: 12, },
    activeCell: { height: 100, aspectRatio: 1, padding: 1, },
    archiveCell: { width: '33.33%', aspectRatio: 1, padding: 1 },
    storyThumb: { flex: 1, borderRadius: 8, backgroundColor: '#e5e7eb'},
});