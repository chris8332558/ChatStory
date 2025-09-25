// Good practice: centralize your API configuration.
// axios is a popular library for making HTTP requests.
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your computer's local IPv4 address. Need to change when connect to different wifi
// Find LAN IP (in terminal): networksetup -getinfo Wi-Fi | grep "IP address"

// const API_BASE_URL = 'http://192.168.10.122:3000/api';
const API_BASE_URL = 'http://192.168.4.80:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});


// Best practice: Use an interceptor to automatically add the token to requests.
// Interceptors run for every request made by the Axios instance they’re attached to and return the possibly modified config/response (or a rejected promise to abort)
// This will be used in protected requests, e.g. fetchRooms, or the token will be null and cause error.
apiClient.interceptors.request.use(async (config) => {
    console.log('client.js: Go through intercepetor');
    const token = await SecureStore.getItemAsync('userToken');
    // Attach to header (your server expects 'x-auth-token'; otherwise prefer Authorization: Bearer <token>)
    if (token) {
        console.log('client.js: Add \'x-auth-token\' to the request config');
        config.headers['x-auth-token'] = token; // allow request to continue
        // Preferred standard in to use config.headers.Authorization = `Bearer ${token}`
    }
    return config;
});

export default apiClient;


// It registers a request interceptor on apiClient. Before each outbound HTTP request, Axios calls the interceptor 
// with the current config. The interceptor asynchronously reads the token from Expo SecureStore and, if present, 
// adds it to the request headers under x-auth-token. Then it returns the config so the request proceeds with that header attached.

// Effect: All requests through apiClient will automatically include the token, so there’s no need to manually set 
// headers for each call. This centralizes auth header injection and reduces repetition, similar to setting 
// Authorization headers in a request interceptor for bearer tokens