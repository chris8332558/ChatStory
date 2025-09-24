import React, { useState, useContext, useEffect } from "react";
import { useRouter } from 'expo-router';
import { View, Button, Text, TextInput, StyleSheet, Alert, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import AuthContext from '../../src/context/AuthContext';
import { getMe, Me, updateMe } from "../../src/api/users";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { listMyActiveStories, listMyArchiveStories, StoryType } from "../../src/api/stories";
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

    const router = useRouter(); 
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        (async () => {
            try {
                const u = await getMe();
                setForm({ username: u.username, email: u.email, display_name: u.display_name });
            } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to load profile');
            }
        })();
    }, []);

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
                setArchiveCursor(page[page.length-1].created_at);       
            } else {
                setArchiveDone(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to load more archive');
        } finally {
            setArchiveLoading(false);
        }
    };

    const onSave = async() => {
        setSaving(true);
        try {
            const updated = await updateMe({
                username: form.username,
                email: form.email,
                display_name: form.display_name,
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
        return (
        <View style={styles.activeCell}>
            <Image source={{ uri: item.media_url }} style={styles.storyThumb} />
        </View>
        );
    };

    const renderArchiveThumb = ({ item } : { item: StoryType }) => {
        return (
        <View style={styles.archiveCell}>
            <Image source={{ uri: item.media_url }} style={styles.storyThumb} />
        </View>
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
    storyThumb: { flex: 1, backgroundColor: '#e5e7eb'},
});