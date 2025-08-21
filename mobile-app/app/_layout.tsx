// this _layout.tsx file replaces the old App.js file
// In short, do not add App.js in a new Expo Router project—use app/_layout.(tsx) 
// as the root wrapper and add screens under app/ as routes

// There are two methods to navigate through screens, you can only choose one to use:
// 1. Expo Router: A modern, file-based routing system. It uses the structure of your files and 
// folders inside an app/ directory to automatically create navigators and screens. 
// You configure the layout (like a stack navigator) in a _layout.js file, but you don't define the individual screens there

// 2. React Navigation: A traditional, component-based routing library. With this library, you programmatically 
// define your navigators and screens inside a component, explicitly listing each screen using <Stack.Screen> 
// and wrapping everything in a <NavigationContainer>

import React from "react";
import { AuthProvider } from '../src/context/AuthContext';
import { Stack, Slot } from 'expo-router';

// The <Slot /> component renders the current child route. Expo Router will handle switching 
// between the (auth) and (tabs) groups based on the logic in our index.js file.
export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
};
