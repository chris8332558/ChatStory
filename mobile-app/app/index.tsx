// Expo will
import React, { useState } from "react";
import { useRouter } from 'expo-router';
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import apiClient from '../src/api/client';
import * as SecureStore from 'expo-secure-store';

// Defines the screen component. It receives the navigation prop from React Navigation, which allows it to move to other screens.
export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Triggered when the Login button is pressed
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        // We will implement the login API call later
        try {
            const response = await apiClient.post('/auth/login', { email, password }); // from authController
            const { token } = response.data;

            console.log("Log in with:", email, password);
            // Securely store the token
            await SecureStore.setItemAsync('userToken', token);

            // For now, just navigate to the Home screen
            // This is where you would call apiClient.post('auth/login', { email, password });
            router.replace('/home');
            
        } catch(err) {
            console.error(err);
            Alert.alert('Login Failed', 'Invalid credentials. Please try again');
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



// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen.....</Text>
//     </View>
//   );
// }
