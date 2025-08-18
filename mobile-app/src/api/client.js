// Good practice: centralize your API configuration.
// axios is a popular library for making HTTP requests.
import axios from 'axios';

// Replace with your computer's local IPv4 address
const API_BASE_URL = 'http://192.168.4.68:3000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

export default apiClient;