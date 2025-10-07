// app/(tabs)/_layout.js
import React, { useContext } from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useUnreads } from '../../src/state/useUnreads';
import { UnreadContext } from '../../src/context/UnreadContext';


function Badge({ count }: { count: number }) {
  // if (!count) return null;
  console.log(`_layout.tsx: Update unread badge count: ${count}`);
  return (
    <View style={{ position: 'absolute', top: -4, right: -10, backgroundColor: 'red', borderRadius: 10, minWidth: 18, height: 18, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center'}}>
      <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
    </View>

  )
}

export default function TabsLayout() {
  // const { total } = useUnreads(SOCKET_URL);
  const { total } = useContext(UnreadContext);

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ 
        title: 'Messages', 
        tabBarIcon: ({ color }) => (
          <View>
            <Text style={{ color }}>💬</Text>
            <Badge count={total} />
          </View>
        ),
        }} 
      />
      <Tabs.Screen name="friends" options={{ title: 'Friends' }} />
      <Tabs.Screen name="profile" options={{ title: 'Me' }} />
    </Tabs>
  );
}