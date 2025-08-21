// The index.js file acts as a gatekeeper. It checks the authentication status and 
// immediately redirects the user to the appropriate starting screen.

import React, { useContext, useState } from "react";
import AuthContext from "../src/context/AuthContext";
import { Redirect } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from "react-native";

// Defines the screen component. It receives the navigation prop from React Navigation, which allows it to move to other screens.
export default function StartPage() {
    const { userToken, isLoading } = useContext(AuthContext);

    /*
    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size='large' />
            </View>
        );
    }
    */

    if (userToken) {
        // User is singed in, redirect to the home page
        return <Redirect href="/home" />;
    } else {
        console.log("Has no userToken, go to login screen");
        return <Redirect href="/login" />;
    }
}


const styles = StyleSheet.create({
    loading: {
        flex: 1, justifyContent: 'center', alignItems: 'center'
    }
})