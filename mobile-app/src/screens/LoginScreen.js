import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import apiClient from "../api/client";

// Defines the screen component. It receives the navigation prop from React Navigation, which allows it to move to other screens.
const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassowrd] = useState('');

    // Triggered when the Login button is pressed
    const handleLogin = async () => {
        // We will implement the login API call later
        // For now, just navigate to the Home screen
        console.log("Log in with:", email, password);
        // This is where you would call apiClient.post('auth/login', { email, password });
        // This is the key action here. It tells the navigation system to move the user to the screen named 'Home'.
        navigation.navigate('Home');
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
            onChangeText={setPassowrd}
            secureTextEntry // A prop used on the password field to obscure the text with dots.
            />

            <Button title="Login" onPress={handleLogin} />
        </View>
    );
}


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
})


// The default keyword in export default LoginScreen; 
// signifies that the LoginScreen component is the main or primary thing being exported from this file.
// You can have only one default export per file
export default LoginScreen;


