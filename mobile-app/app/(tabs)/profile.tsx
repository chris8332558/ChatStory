
import React, { useState, useContext, useEffect } from "react";
import { useRouter } from 'expo-router';
import { View, Button, Text, TextInput, StyleSheet, Alert, FlatList } from 'react-native';
import AuthContext from '../../src/context/AuthContext';
import { getMe, Me, updateMe } from "../../src/api/users";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import ui from '../../src/ui/shared';

export default function ProfileScreen() {
    const [me, setMe] = useState<Me | null>(null);
    const [form, setForm] = useState<Partial<Me>>({});
    const [saving, setSaving] = useState(false);

    const router = useRouter(); 
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        (async () => {
            try {
                const u = await getMe();
                setForm({ username: u.username, email: u.email });
            } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to load profile');
            }
        })();
    }, []);

    const onSave = async() => {
        setSaving(true);
        try {
            const updated = await updateMe({
                username: form.username,
                email: form.email,
            });
            setMe(updated);
            Alert.alert('Saved', 'Profile updated');
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to udpate profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        console.log('profile: logout');
        router.replace('/login') // Go to the index.tsx screen
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput style={styles.input} value={form.username || ''} onChangeText={(t) => setForm(s => ({ ...s, username: t }))} />
                    </View>

                    <View style={styles.formRow}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput style={styles.input} value={form.email || ''} keyboardType='email-address' onChangeText={(t) => setForm(s => ({ ...s, email: t }))} />
                    </View>

                    <Button title={saving ? 'Saving...' : 'Save'} onPress={onSave} disabled={saving} />
                </View>
                {/* <FlatList 
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Text style={styles.title}>Profile</Text>

                            <View style={styles.formRow}>
                                <Text style={styles.label}>Username</Text>
                                <TextInput style={styles.input} value={form.username || ''} onChangeText={(t) => setForm(s => ({ ...s, username: t }))} />
                            </View>

                            <View style={styles.formRow}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput style={styles.input} value={form.email || ''} keyboardType='email-address' onChangeText={(t) => setForm(s => ({ ...s, email: t }))} />
                            </View>

                            <Button title={saving ? 'Saving...' : 'Save'} onPress={onSave} disabled={saving} />
                        </View>
                    }
                /> */}
                <Button title='Log out' onPress={handleLogout} />
            </SafeAreaView>
        </SafeAreaProvider>
    )
};




const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: { paddingBottom: 8 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
    formRow: { marginBottom: 10 },
    label: { fontSize: 12, color: '#64748b', marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, height: 40, backgroundColor: 'white'},
});