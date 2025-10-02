import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import apiClient from '../api/client';

export async function registerForPush() {
    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
    }
    const token = await Notifications.getExpoPushTokenAsync();
    await apiClient.post('/devices/register-token', { 
        expoPushToken: token.data, platform: Device.osName, appVersion: '1.0.0',
    });
}