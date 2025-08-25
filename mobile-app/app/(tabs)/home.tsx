import React, { useState, useContext } from "react";
import { useRouter } from 'expo-router';
import { View, Button, Text, StyleSheet } from 'react-native';
import AuthContext from '../../src/context/AuthContext';

export default function HomeScreen() {
    const { logout } = useContext(AuthContext);

    const handleLogout = async () => {
        await logout();
        console.log('home: logout');
    };

    return (
        <View style={styles.container}>
            <Text>Welcome to the Home Screen!</Text>
            <Button title='Log out' onPress={handleLogout} />
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});