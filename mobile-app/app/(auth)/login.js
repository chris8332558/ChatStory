// Expo will
import React, { useState, useContext } from "react";
import { Link, useRouter } from 'expo-router';
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import apiClient from '../../src/api/client';
import AuthContext from '../../src/context/AuthContext';
import * as SecureStore from 'expo-secure-store';

// Defines the screen component. It receives the navigation prop from React Navigation, which allows it to move to other screens.
export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    // Triggered when the Login button is pressed
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        // We will implement the login API call later
        try {
            await login(email, password);
            // the redirect will happen automatically via the root index file
            console.log('handleLogin::apiClient.post()');
            const response = await apiClient.post('/auth/login', { email, password }); // from authController
            console.log('Get response');
            const { token } = response.data;

            console.log("Log in with:", email, password);
            // Securely store the token
            await SecureStore.setItemAsync('userToken', token);
            
        } catch(err) {
            console.error(err);
            Alert.alert('Login Failed', 'Invalid credentials. Please try again (handleLogin)');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput 
            style={styles.input}
            placeholder="Email"
            value={email} // Binds the input's displayed value directly to the email state variable.
            onChangeText={setEmail} // Call the setEmail function whenever the text is changed
            keyboardType="email-address"
            autoCapitalize="none"
            />
                
            <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry // A prop used on the password field to obscure the text with dots.
            />

            <Button title="Login" onPress={handleLogin} />
            <Link href='/register' style={styles.link}>Do not have an account? Sign up</Link>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },

    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },

    link: {
        marginTop: 15,
        textAlign: 'center',
        color: 'blue',
    },
});