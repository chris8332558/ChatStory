import { useState } from "react";
import { Alert, View, Text, TextInput, Button, StyleSheet } from 'react-native';
import apiClient from "../../src/api/client";
import { Link, router } from 'expo-router'; // Use Link for navigation

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async() => {
        if (!username || !email || !password) {
            Alert.alert("Missing Information", "Enter all the fields");
            return;
        }

        try {
            await apiClient.post('/auth/register', {username, email, password});
            Alert.alert('Registration Successful', 'You can now log in with your credentials.', 
                [
                    // Once the user press 'OK', navigate them to the login screen.
                    { text: 'OK', onPress: () => {router.push('/login')} }
                ]
            );
        } catch (error) {
            console.error('Registration failed:', error);
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
            Alert.alert('Registration Failed', errorMessage);
        };
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>Create an Account</Text>
        <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
        />
        <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
        />
        <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
        />
        <Button title="Register" onPress={handleRegister} />
        <Link href="/login" style={styles.link}>
            Already have an account? Log in
        </Link>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    link: {
        marginTop: 15,
        textAlign: 'center',
        color: 'blue',
    },
});