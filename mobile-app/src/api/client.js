// Good practice: centralize your API configuration.
// axios is a popular library for making HTTP requests.
import axios from 'axios';

// Replace with your computer's local IPv4 address. Need to change when connect to different wifi
// Find LAN IP (in terminal): networksetup -getinfo Wi-Fi | grep "IP address"
const API_BASE_URL = 'http://192.168.10.230:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

export default apiClient;