// app/(auth)/_layout.js
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    // hide headers for auth screens (optional)
    <Stack screenOptions={{ headerShown: false, }} />
  );
}
