import React, { useState, useEffect, useContext, useCallback } from "react";
import { router } from 'expo-router';
import { View, Button, Text, TextInput, StyleSheet, Alert, TouchableOpacity, FlatList, Modal } from 'react-native';
import apiClient from "../../src/api/client";

import ui from '../../src/ui/shared';


// Define the type for a room obejct
interface Room {
    room_id: string;
    name: string;
}

export default function HomeScreen() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');

    const fetchRooms = useCallback(async () => {
        try {
            const response = await apiClient.get('/rooms');
            console.log('fetchrooms:', response.data);
            setRooms(response.data);
        } catch (err) {
            console.error('Failed to fetch rooms', err);
            Alert.alert('Error', 'Could not fetch your rooms.');
        }
    }, []);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms])

    const handleCreateRoom = async () => {
        if (!newRoomName.trim()) {
            Alert.alert('Invalid Name', 'Room name connot be empty.');
        }
        try {
            await apiClient.post('/rooms', { name: newRoomName });
            setNewRoomName('');
            setModalVisible(false);
            fetchRooms(); // Re-fetch rooms to show the new one
        } catch (err) {
            console.error('Failed to create room', err);
            Alert.alert('Error', 'Could not create the room.');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList 
                data={rooms}
                keyExtractor={(item) => item.room_id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => router.push(`/chat/${item.room_id}?room_name=${item.name}`)}>
                        <View style={styles.roomItem}>
                            <Text style={styles.roomName}>{item.name}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListHeaderComponent={<Text style={styles.header}>Your Chat Rooms</Text>}
            />
            <Button title="Create New Room" onPress={() => setModalVisible(true)} />

            <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>New Room</Text>
                        <TextInput style={styles.input} placeholder="Enter room name" value={newRoomName} onChangeText={setNewRoomName}/>
                        <Button title="Create" onPress={handleCreateRoom}/>
                        <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
                    </View>
                </View>
            </Modal>
            
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: ui.colors.bg,
    },

    roomItem: {
        paddingVertical: ui.spacing.lg,
        paddingHorizontal: ui.spacing.md,
        backgroundColor: ui.colors.white,
        borderRadius: ui.radii.md,
        marginBottom: ui.spacing.md,
        borderWidth: 1,
        borderColor: ui.colors.border,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: ui.radii.sm,
        shadowOffset: { width: 1, height: 2 },
        elevation: 1,
    },

    roomName: {
        fontSize: 16,
        color: ui.colors.text,
        fontWeight: 600,
    },

    header: {
        fontSize: 22,
        paddingLeft: 5,
        paddingVertical: 5,
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
    
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: ui.colors.input,
        borderRadius: ui.radii.md,
        paddingHorizontal: ui.spacing.md,
        backgroundColor: ui.colors.white,
        marginBottom: ui.spacing.md,
    },
});