// This screen is a real-time chat UI that ties together four pieces: Expo Router for routing, a REST API for history, 
// Socket.IO for live updates, and the JWT from the auth context for socket authentication. It first loads recent messages 
// over HTTP, then opens an authenticated socket, joins the room, listens for new messages, and lets the user send messages. 
// The server persists messages and broadcasts them to room members, which this screen renders as they arrive
import AuthContext from "../../src/context/AuthContext"; // Read the JWT
import { router, useLocalSearchParams } from "expo-router";
import  { io, Socket } from 'socket.io-client'; // Talk to the WebSocket server
import { useContext, useEffect, useRef, useState } from "react";
import apiClient from "../../src/api/client";
import { ActivityIndicator, FlatList, Button, View, Text, StyleSheet, TextInput, Keyboard, KeyboardAvoidingView, Platform, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity } from "react-native";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import ui from '../../src/ui/shared';
import { fetchRoomMessages } from "../../src/api/messages";
import { addUserToRoom } from "../../src/api/members";

// apiClient.getUri() returns 'http://10.1.16.172:3000/api'
// Points at the Socket.IO server
const SOCKET_URL = apiClient.getUri().replace(/\/api$/, ''); // get rid of the '/api'

export type Message = {
    _id: string;
    room_id: string;
    user_id: string;
    username: string;
    text: string;
    created_at: string;
};

export default function ChatScreen() {
    // Get room id and room name from the file path (e.g. /chat/123?room_name=General)
    const { room_id, room_name } = useLocalSearchParams<{ room_id: string; room_name: string }>();
    const [ messages, setMessages ] = useState<Message[]>([]);
    const [ currentMessage, setCurrentMessage ] = useState('');
    const [ loadingHistory, setLoadingHistory ] = useState(false);

    const [ emailToAdd, setEmailToAdd ] = useState('');
    const [ addMemberModalVisible, setAddMemberModalVisible] = useState(false);
    const { userToken } = useContext(AuthContext); // We can get user id and user name from the userToken (user.id, user.username)
    const socketRef = useRef<Socket | null>(null); // Holds the live Socker.IO client instance across renders (useRef avoids reconnecting on every render)

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
        s.on('receiveMessage', (msg: Message) => {
            setMessages(preMessages => [msg, ...preMessages]);
        });

        s.on('connect_error', (err) => {
            console.error('[room_id].tsx: Socket connect_error', err);
        })

        // Discount on connect unmount
        return () => {
            s?.disconnect();
            socketRef.current = null;
        };
    }, [room_id, userToken]);

    const handleSendMesssage = () => {
        if (!socketRef.current) {
            console.error("[roomId].tsx: socketRef.current is null");
        }
        else if (currentMessage.trim()) {
            const text = currentMessage.trim()
            socketRef.current.emit('sendMessage', { room_id, text });
            //setMessages((prevMessages) => [messageData, ...prevMessages]); // Don't need to setMessages. the s.on('receiveMessage') above will handle this
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
            const res = await addUserToRoom(room_id as string, { email: emailToAdd.trim() });
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
                    <Button title="<" onPress={() => router.back()} />
                    <Button title="Add Member" onPress={() => setAddMemberModalVisible(true)} />
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
                                <TextInput style={styles.input} placeholder="Enter User Email" value={emailToAdd} onChangeText={setEmailToAdd}/>
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
        height: 44,
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
});