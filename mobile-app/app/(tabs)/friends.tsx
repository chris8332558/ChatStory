import React, { useState, useEffect } from "react";
import { View, Button, Text, FlatList, StyleSheet, Alert, ActivityIndicator, TextInput, Image } from 'react-native';
import { acceptRequest, listFriends, deleteFriend, listRequests, rejectRequest, sendRequest } from "../../src/api/friends";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

export default function FriendsScreen() {
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<{ incoming: any[], outgoing: any[] }>({ incoming: [], outgoing: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [requestIdentifirer, setRequestIdentifier] = useState<string>(''); // Can be user_id, email, or useranme

    async function load() {
        setIsLoading(true);
        try {
            // const [f, r] = await Promise.all([listRequests()]);
            const r = await listRequests();
            const f = await listFriends();
            console.log(`friends.tsx: requests: incoming=${r.incoming.length}, outgoing=${r.outgoing.length}`);
            setFriends(f);
            setRequests(r);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to load friends/requests');
            console.error('friends.tsx: load error: ', err);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    // TODO: get the reciver id. Need to use backend instead
    function getReceiverId(r: any) {
        return r.requestor === 1 ? r.uid2 : r.uid1;
    }

    async function onSendRequest() {
        const v = requestIdentifirer.trim();
        console.log(`friends.tsx: onSendRequest: v=${v}`);
        if (!v) {
            Alert.alert('Error', 'Enter user_id, email, or username to send frient request');
            return;
        } 

        try {
            if (v.includes('@')) {
                console.log(`friends.tsx: sendRequest by email ${v}`);
                await sendRequest({ email: v });
            } else if (/^[a-z0-9._-]{3,}$/i.test(v)) {
                await sendRequest({ username: v });
            } else {
                await sendRequest({ to_user_id: v });
            }
            Alert.alert('Success', 'Friend request sent');
            setRequestIdentifier('');
            load();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to send request.');
        }
    }

    async function onAcceptRequest(request_id: string) {
        try {
            await acceptRequest(request_id);
            load();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to accept request.');
        }
    }

    async function onRejectRequest(request_id: string) {
        try {
            await rejectRequest(request_id);
            load();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to reject request.');
        }
    }

    async function onDeleteFriend(friend_id: string) {
        try {
            await deleteFriend(friend_id);
            load();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to delete friend.');
        }
    }

    if (isLoading) {
        return (
            <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center', alignItems: 'center'}} />
        )
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <FlatList 
                    ListHeaderComponent={
                        <View style={{ padding: 12 }}>
                            <Text style={styles.title}>Friends</Text>
                            <View>
                                <TextInput 
                                    placeholder="Enter user_id, email, or username to send request"
                                    placeholderTextColor={'#C0C0C0'}
                                    value={requestIdentifirer}
                                    onChangeText={setRequestIdentifier}
                                    autoCapitalize="none"
                                    style={styles.input}
                                />
                                <Button title="Send Friend Request" onPress={onSendRequest} />
                            </View>
                            
                            <Text style={styles.section}>Incoming Requests</Text>
                            
                            {requests.incoming.length === 0 ? <Text style={styles.subtle}>No incoming requests</Text> : null}
                            {requests.incoming.map((r) => (
                                <View key={r.request_id} style={styles.reqRow}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
                                        <Text style={styles.reqText}>{r.requestor}</Text>
                                        <Button title='Accept' onPress={() => onAcceptRequest(r.request_id)} />
                                        <Button title='Reject' color="#ef4444" onPress={() => onRejectRequest(r.request_id)} />
                                    </View>
                                </View>
                            ))}

                            <Text style={styles.section}>Outgoing Requests</Text>
                            {requests.outgoing.length === 0 ? <Text style={styles.subtle}>No outgoing requests</Text> : null}
                            {requests.outgoing.map((r) => (
                                <View key={r.request_id} style={styles.reqRow}>
                                    <Text style={styles.reqText}>{getReceiverId(r)}</Text>
                                </View>
                            ))}

                            <Text style={styles.section}>Your Friends</Text>
                        </View>

                    }

                    data={friends}
                    keyExtractor={(item) => item.user_id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.friendRow}>
                            <Image source={{ uri: item.avatar_url || 'https://www.gravatar.com/avatar?d=mp' }} style={styles.avatar} />
                            <View style={{ flex: 1, flexDirection: 'column' }}>
                                <Text style={styles.name}>{item.display_name}</Text>
                                <Text style={styles.subtle}>{item.username}</Text>
                                <Button title="Delete" color="#ef4444" onPress={() => onDeleteFriend(item.user_id)} />
                            </View>
                        </View>
                    )}
                />
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        
        width: 300,
    },
    friendRow: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        width: '100%',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    name: {
        fontSize: 18,
        fontWeight: '500',
    },
    subtle: {
        color: '#666',
    },
    section: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 8,
    },
    reqRow: {
        padding: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#666',
    },
    reqText: {
        fontSize: 18,
    }
});