import React, { useState, useContext } from "react";
import { router } from 'expo-router';
import { View, Button, Text, StyleSheet } from 'react-native';
import AuthContext from '../../src/context/AuthContext';

export default function FriendsScreen() {
    return (
        <View style={styles.container}>
            <Text>Welcome to the Friends Screen!</Text>
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