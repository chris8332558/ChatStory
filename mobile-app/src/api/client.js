// Good practice: centralize your API configuration.
// axios is a popular library for making HTTP requests.
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your computer's local IPv4 address. Need to change when connect to different wifi
// Find LAN IP (in terminal): networksetup -getinfo Wi-Fi | grep "IP address"

const API_BASE_URL = 'http://192.168.10.122:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});


// Best practice: Use an interceptor to automatically add the token to requests.
// This will be used in protected requests, e.g. fetchRooms, or the token will be null and cause error.
apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default apiClient;