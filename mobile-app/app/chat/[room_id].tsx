// This screen is a real-time chat UI that ties together four pieces: Expo Router for routing, a REST API for history, 
// Socket.IO for live updates, and the JWT from the auth context for socket authentication. It first loads recent messages 
// over HTTP, then opens an authenticated socket, joins the room, listens for new messages, and lets the user send messages. 
// The server persists messages and broadcasts them to room members, which this screen renders as they arrive
import AuthContext from "../../src/context/AuthContext"; // Read the JWT
import { router, useLocalSearchParams } from "expo-router";
import  { io, Socket } from 'socket.io-client'; // Talk to the WebSocket server
import { useContext, useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import apiClient from "../../src/api/client";
import { ActivityIndicator, FlatList, Button, View, Text, StyleSheet, TextInput, Keyboard, KeyboardAvoidingView, Platform, Alert, Modal, TouchableWithoutFeedback } from "react-native";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import ui from '../../src/ui/shared';
import { fetchRoomMessages, MessageType } from "../../src/api/messages";
import { addUserToRoom } from "../../src/api/members";
import { markRoomRead } from "../../src/api/unreads";
import { UnreadContext } from '../../src/context/UnreadContext';
import { getRoomByRoomId } from '../../src/api/room';


// apiClient.getUri() returns 'http://10.1.16.172:3000/api'
// Points at the Socket.IO server
const SOCKET_URL = apiClient.getUri().replace(/\/api$/, ''); // get rid of the '/api'

export default function ChatScreen() {
    // Get room id and room name from the file path (e.g. /chat/123?room_name=General)
    const { room_id } = useLocalSearchParams<{ room_id: string }>();
    const [ messages, setMessages ] = useState<MessageType[]>([]);
    const [ currentMessage, setCurrentMessage ] = useState('');
    const [ loadingHistory, setLoadingHistory ] = useState(false);
    const [ roomName, setRoomName ] = useState('')

    const [ emailToAdd, setEmailToAdd ] = useState('');
    const [ addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    const { userToken } = useContext(AuthContext); // We can get user id and user name from the userToken (user.id, user.username)
    const socketRef = useRef<Socket | null>(null); // Holds the live Socker.IO client instance across renders (useRef avoids reconnecting on every render)
    const { markRead, setRoomZero, refresh } = useContext(UnreadContext);


    const fetchRoomName = useCallback(async () => {
        try{
            const room = await getRoomByRoomId(room_id);
            console.log('room_name', room.name);
            setRoomName(room.name);
        } catch (err) {
            console.error('Failed to fetch room name', err);
            Alert.alert('Error', 'Could not fetch your room name.');
        }
    }, []);

    useEffect(() => {
        fetchRoomName();
    }, [fetchRoomName]);

    // Focus → mark read immediately when in the room (idempotent, optimistic zero)
    useFocusEffect(
        useCallback(() => {
            console.log('Screen is focused!');
            if (room_id) {
                console.log(`Marking room ${room_id} as read on focus`);
                markRead(room_id as string).finally(refresh);
            }
        return () => {};
        }, [room_id, markRead, refresh])
    );

    // Fetch historical messages over HTTP
    useEffect(() => {
        let mounted = true;
        const fetchMessageHistory = async() => {
            console.log("[room_id].tsx: fetch message history")
            if (!room_id) {
                console.error('room_id is null');
                return;
            }
            setLoadingHistory(true);

            try {
                const response = await fetchRoomMessages(room_id as string, 50);
                if (mounted) setMessages(response);
            } catch (err) {
                console.error('Failed to fetch message history:', err);
                Alert.alert('Error', 'Failed to load messages.');
            } finally {
                if (mounted) setLoadingHistory(false);
            }
        };
        fetchMessageHistory();
        return () => { mounted = false };
    }, [room_id]);

    // Mark room as read when entering the room
    useEffect(() => {
        if (!room_id) {
            // Optimistic: fire and forget, then refresh unreads
            markRoomRead(room_id as string).then(() => refresh());
        }
    }, [room_id, refresh]);

    // Manage WebSocket connection
    useEffect(() => {
        if (!room_id || !userToken) {
            console.error(`[room_id].tsx: ${room_id}, userToken: ${userToken}`);
            return;
        }

        // Creates the client with transports:['websocket'] to prefer WebSocket in React Native, which often avoids polling issues.
        // The JWT is sent in the auth field of the handshake; on the server, io.use middleware reads socket.handshake.auth.token, 
        // verifies it, and stores the decoded user on socket, rejecting unauthorized clients
        const s = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: { token: userToken }, // send JWT to server auth middleware
        })

        // Connect to the socket server
        socketRef.current = s;

        s.on('connect', () => {
            console.log(`[room_id].tsx: s.on(connect) room_id: ${room_id}`);
            s.emit('joinRoom', room_id);
        });


        // Listen for incoming message
        let t: any = null;
        s.on('receiveMessage', ({ msg, newSeq }: { msg: MessageType; newSeq: number }) => {
            // console.log(`[room_id].tsx: s.on(receiveMessage): New message received: ${msg.text}`);
            console.log(`[room_id].tsx: s.on(receiveMessage): New message received: ${msg.text}, newSeq: ${newSeq}`);
            setMessages(preMessages => [msg, ...preMessages]);

            if (msg.room_id === room_id) {
                // Debounce: mark read shortly after receiving to avoid spamming PATCH
                clearTimeout(t);
                t = setTimeout(() => { markRead(room_id as string).catch(() => {}); }, 250)
                console.log(`[room_id].tsx: Debounced markRead for room_id: ${room_id}`);
            }
        });

        s.on('connect_error', (err) => {
            console.error('[room_id].tsx: Socket connect_error', err);
        })

        // Discount on connect unmount
        return () => {
            clearTimeout(t);
            s?.disconnect();
            socketRef.current = null;
        };
    }, [room_id, userToken, markRead]);


    async function handleSendMesssage() {
        if (!socketRef.current) {
            console.error("[roomId].tsx: socketRef.current is null");
        }
        else if (currentMessage.trim()) {
            const text = currentMessage.trim()
            socketRef.current.emit('sendMessage', { room_id, text });
            //setMessages((prevMessages) => [messageData, ...prevMessages]); // Don't need to setMessages. the s.on('receiveMessage') above will handle this
            await markRead(room_id as string).catch(() => {}); // Optimistically mark read after sending
            setRoomZero(room_id as string); // Optimistically set local unread to zero
            setCurrentMessage('');
        }
    };

    async function handleAddMember() {
        console.log(`[room_id].tsx: handleAddMember`);
        if (!emailToAdd.trim()) {
            Alert.alert('Email Is Required', 'Enter the email to add the user');
            return;
        }
        try {
            await addUserToRoom(room_id as string, { email: emailToAdd.trim() });
            Alert.alert('Success', `User added (${emailToAdd})`);
            setEmailToAdd('');
        } catch (err) {
            Alert.alert('Error', 'Conld not add user');
            console.log('[room_id].tsx: handleAddMember error', err);
        }
    };


    if (loadingHistory) {
        return <ActivityIndicator size='large' style={{ flex: 1 }} />
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <View style={{backgroundColor: 'lightgrey', justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-start', padding: 10, borderBottomWidth: 3, borderBottomColor: 'black'}}>
                    <View style={{flexDirection: 'row', flex: 1 }}>
                        <Button title="<" onPress={() => router.back()} />
                        <Text style={styles.roomName}>{roomName}</Text>
                    </View>
                    <Button title="Add" onPress={() => setAddMemberModalVisible(true)} />
                    <Button title="Archive" onPress={() => router.push(`/chat/${room_id}/stories-archive`)} />
                </View>
                <View style={{backgroundColor: 'skyblue', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 10, borderBottomWidth: 3, borderBottomColor: 'black'}}>
                    <Button title="Stories" onPress={() => router.push(`/chat/${room_id}/stories`)}/>
                    <Button title="+" onPress={() => router.push(`/chat/${room_id}/post-story`)}/>
                </View>

                <FlatList
                    inverted // Shows latest messages at the bottom
                    data={messages}
                    renderItem={({ item }) => (
                    <View style={styles.messageBubble}>
                        <Text style={styles.messageUser}>{item.username}</Text>
                        <Text style={styles.messageText}>{item.text}</Text>
                    </View>
                    )}
                    keyExtractor={(item) => item._id?.toString() || `${item.created_at}-${item.user_id}`}
                    style={styles.messageList}
                />

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} >
                        <View style={styles.inputContainer}>
                            <TextInput style={styles.input} value={currentMessage} onChangeText={setCurrentMessage} placeholder="Type a message..." returnKeyType="send" onSubmitEditing={handleSendMesssage}/>
                            <Button title="Send" onPress={handleSendMesssage} />
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>

                <TouchableWithoutFeedback onPress={Keyboard.dismiss} >
                    <Modal visible={addMemberModalVisible} animationType="slide" transparent={true}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Add Member</Text>
                                <TextInput style={styles.modalInput} placeholder="Enter User Email" value={emailToAdd} onChangeText={setEmailToAdd}/>
                                <Button title="Add" onPress={handleAddMember}/>
                                <Button title="Cancel" onPress={() => setAddMemberModalVisible(false)} color="red" />
                            </View>
                        </View>
                    </Modal>
                </TouchableWithoutFeedback>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: ui.colors.bg,
    },

    roomName: {
        fontSize: 25,
        fontWeight:'400', 
        color: ui.colors.primary,
        paddingLeft: 20,
    },

    messageBubble: {
        backgroundColor: ui.colors.white,
        borderRadius: ui.radii.lg,
        paddingVertical: ui.spacing.sm,
        paddingHorizontal: ui.spacing.md,
        marginVertical: ui.spacing.xs,
        borderWidth: 1,
        borderColor: ui.colors.border,
        alignSelf: 'stretch',
    },

    messageUser: {
        color: ui.colors.muted,
        fontWeight: '700',
        marginBottom: 2,
    },

    messageText: {
        color: ui.colors.text,
    },

    messageList: {
        flex: 1,
        paddingHorizontal: ui.spacing.sm,
        paddingTop: ui.spacing.sm, 
    },

    inputContainer: {
        flexDirection: 'row',
        gap: 8,
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: ui.colors.border,
        backgroundColor: ui.colors.white,
    },

    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: ui.colors.input,
        borderRadius: ui.radii.md,
        paddingHorizontal: 12,
        backgroundColor: ui.colors.white,
    },

    modalContainer: {
        flex: 1,
        backgroundColor: ui.colors.overlay,
        justifyContent: 'center',
        flexDirection: 'column',
        paddingHorizontal: 20,
    },

    modalContent: {
        backgroundColor: ui.colors.white,
        borderRadius: ui.radii.lg,
        padding: ui.spacing.lg,
        borderWidth: 1,
        borderColor: ui.colors.border,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: ui.colors.text,
        marginBottom: ui.spacing.md,
    },

    modalInput: {
        height: 40,
        borderWidth: 1,
        borderColor: ui.colors.input,
        borderRadius: ui.radii.md,
        paddingHorizontal: 12,
        backgroundColor: ui.colors.white,
    },
});