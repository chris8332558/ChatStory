// this _layout.tsx file replaces the old App.js file
// In short, do not add App.js in a new Expo Router project—use app/_layout.(tsx) 
// as the root wrapper and add screens under app/ as routes

// app/_layout.tsx is the root layout file, and is rendered before any other route in the app.

// There are two methods to navigate through screens, you can only choose one to use:
// 1. Expo Router: A modern, file-based routing system. It uses the structure of your files and 
// folders inside an app/ directory to automatically create navigators and screens. 
// You configure the layout (like a stack navigator) in a _layout.js file, but you don't define the individual screens there

// 2. React Navigation: A traditional, component-based routing library. With this library, you programmatically 
// define your navigators and screens inside a component, explicitly listing each screen using <Stack.Screen> 
// and wrapping everything in a <NavigationContainer>

import React, { useContext, useEffect } from "react";
import AuthContext, { AuthProvider } from '../src/context/AuthContext';
import { UnreadProvider } from '../src/context/UnreadContext';
import { router, Slot } from 'expo-router';
import { View, ActivityIndicator } from "react-native";
import * as Notifications from 'expo-notifications';
import apiClient from "../src/api/client";

const SOCKET_URL = apiClient.getUri().replace(/\/api$/, '');

// The <Slot /> component renders the current child route. Expo Router will handle switching 
// between the (auth) and (tabs) groups based on the logic in our index.js file.
export default function RootLayout() {
  // Inner component that has access to AuthContext
  function RootLayoutNav() {
    const { userToken, isLoading } = useContext(AuthContext);

    useEffect(() => {
      const sub = Notifications.addNotificationReceivedListener((resp) => {
        // console.log('_layout.tsx: Notification Received: ', resp);
        const data = resp.request.content.data as any;
        if (data?.url) router.push(data.url);
        else if (data?.room_id) router.push(`/chat/${data.room_id}`)
      })

      return () => sub.remove();
    }, []);

    // CRITICAL: Show loading while checking auth state
    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    // The Slot will render the appropriate route group based on the current route
    // Expo Router will automatically show (auth) routes when userToken is null
    // and (tabs) routes when userToken exists, based on our routing structure
    return <Slot />;
  }

  return (
    <AuthProvider>
      <UnreadProvider socketUrl={SOCKET_URL}>
        <RootLayoutNav />
      </UnreadProvider>
    </AuthProvider>
  );
};
