import { useState, useContext } from 'react';
import { Alert, View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router'; // Use Link for navigation
import AuthContext from "../../src/context/AuthContext";
import { isAxiosError } from 'axios';

export default function RegisterScreen() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const {register, isLoading } = useContext(AuthContext);

    const handleRegister = async() => {
        if (!username || !email || !password) {
            Alert.alert("Missing Information", "Enter all the fields");
            return;
        }

        let errorMessage = 'An unexpected error occurred.';
        try {
            await register(username.trim(), email.trim(), password);
        } catch (err) {
            console.error('Registration failed:', err);
            if (isAxiosError(err) && err.response) {
                errorMessage = err.response.data.message;
            }
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
            secureTextEntry={!showPassword}
        />

        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>

        <Button title={isLoading ? "Please wait..." : "Register"} onPress={handleRegister} disabled={isLoading} />
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