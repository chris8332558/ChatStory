import AuthContext from "../../src/context/AuthContext";
import { router, useLocalSearchParams } from "expo-router";
import  { io, Socket } from 'socket.io-client';
import { useContext, useEffect, useRef, useState } from "react";
import apiClient from "../../src/api/client";
import { ActivityIndicator, FlatList, Button, View, Text, StyleSheet, TextInput, KeyboardAvoidingView } from "react-native";
import ui from '../../src/ui/shared';

// apiClient.getUri() returns 'http://10.1.16.172:3000/api'
const SOCKET_URL = apiClient.getUri().replace(/\/api$/, ''); // get rid of the '/api'

interface Message {
    text: string;
    user: { id: string, name: string };
    createdAt: Date;
};

export default function ChatScreen() {
    // Get roomId and roomName from the URL path (e.g. /char/123?roomName=General)
    const { roomId, roomName } = useLocalSearchParams<{ roomId: string; roomName: string }>()
    const [ messages, setMessages ] = useState<Message[]>([]);
    const [ currentMessage, setCurrentMessage ] = useState('');
    const [ loadingHistory, setLoadingHistory ] = useState(false);
    const { userToken } = useContext(AuthContext); // We can get user_id and user name from the userToken (user.user_id, user.username)
    const socketRef = useRef<Socket | null>(null);

    // Fetch historical messages
    useEffect(() => {
        const fetchMessageHistory = async() => {
            if (!roomId) return;
            setLoadingHistory(true);

            try {
                // const response = apiClient.get('/rooms/[roomId]/messages');
                // setMessages(response.data);
            } catch (err) {
                console.error('Failed to fetch message history:', err);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchMessageHistory();
    }, [roomId]);

    // Manage WebSocket connection
    useEffect(() => {
        // Connect to the socket server
        socketRef.current = io(SOCKET_URL);

        // Join the specific chat room
        socketRef.current.emit('joinRoom', { roomId });

        // Listen for imcoming message
        socketRef.current.on('receiveMessage', (data) => {
            setMessages((preMessages) => [preMessages, ...data]);
        });
        
        // Discount on connect unmount
        return () => {
            socketRef.current?.disconnect();
        };
    }, [roomId]);

    const handleSendMesssage = () => {
        if (currentMessage.trim() && socketRef.current) {
            const messageData: Message = {
                text: currentMessage,
                user: { id: '1', name: 'Me'},
                createdAt: new Date(),
            }

            socketRef.current.emit('sendMessage', { roomId, message: messageData});
            setMessages((prevMessages) => [messageData, ...prevMessages]);
            setCurrentMessage('');
        }
    };

    if (loadingHistory) {
        return <ActivityIndicator size='large' style={{ flex: 1}} />
    }

    return (
        <KeyboardAvoidingView style={styles.container}>
            <FlatList
                data={messages}
                renderItem={({ item }) => (
                <View style={styles.messageBubble}>
                    <Text style={styles.messageUser}>{item.user.name}</Text>
                    <Text>{item.text}</Text>
                </View>
                )}
                keyExtractor={(item, index) => `${item.createdAt.getTime()}-${index}`}
                inverted // Shows latest messages at the bottom
                style={styles.messageList}
            />
            <View style={styles.inputContainer}>
                <TextInput style={styles.input} value={currentMessage} onChangeText={setCurrentMessage} placeholder="Type a message..." />
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