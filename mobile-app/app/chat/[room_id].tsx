// This screen is a real-time chat UI that ties together four pieces: Expo Router for routing, a REST API for history, 
// Socket.IO for live updates, and the JWT from the auth context for socket authentication. It first loads recent messages 
// over HTTP, then opens an authenticated socket, joins the room, listens for new messages, and lets the user send messages. 
// The server persists messages and broadcasts them to room members, which this screen renders as they arrive
import AuthContext from "../../src/context/AuthContext"; // Read the JWT
import { router, useLocalSearchParams } from "expo-router";
import  { io, Socket } from 'socket.io-client'; // Talk to the WebSocket server
import { useContext, useEffect, useRef, useState } from "react";
import apiClient from "../../src/api/client";
import { ActivityIndicator, FlatList, Button, View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Alert } from "react-native";
import ui from '../../src/ui/shared';
import { fetchRoomMessages } from "../../src/api/messages";

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
    const { room_id, room_name } = useLocalSearchParams<{ room_id: string; room_name?: string }>();
    const [ messages, setMessages ] = useState<Message[]>([]);
    const [ currentMessage, setCurrentMessage ] = useState('');
    const [ loadingHistory, setLoadingHistory ] = useState(false);
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
        })

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

    if (loadingHistory) {
        return <ActivityIndicator size='large' style={{ flex: 1 }} />
    }

    return (
        <KeyboardAvoidingView style={styles.container} keyboardVerticalOffset={90}>
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
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={currentMessage} onChangeText={setCurrentMessage} placeholder="Type a message..." returnKeyType="send" onSubmitEditing={handleSendMesssage}/>
                <Button title="Send" onPress={handleSendMesssage} />
                <Button title="< Back" onPress={() => router.back()} />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
});