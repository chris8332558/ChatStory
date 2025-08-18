import React from 'react';
import { useRouter } from 'expo-router';
import { View, Button, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
    const router = useRouter(); 

    const handleLogout = async () => {
        router.replace('/') // Go to the index.tsx screen
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