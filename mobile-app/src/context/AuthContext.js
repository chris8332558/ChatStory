// Best practice: create an auth context to manage the user's authentication state across the entire app.
// A Context is a React feature for managing global state, 
// like the current user's authentication status. This avoids passing props down through many levels.

import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../api/client'; // axios instance configured with baseURL and interceptor

const TOEKN_KEY = 'userToken';

// Think of this AuthContext as the address where the global auth data will live.
const AuthContext = createContext({
    userToken: null,
    isLoading: true,
    login: async (_email, _password) => {},
    logout: async () => {},
    register: async (_username, _email, _password) => {},
});

// Inside the AuthProvider, useState is used to create two important pieces of state:
// userToken: This will hold the JWT you receive from your backend's /login endpoint. 
// It starts as null because when the app first loads, the user is not logged in.

// isLoading: This is a crucial piece of UI state. When the app starts, you'll want to 
// check if a token is already saved on the device (from a previous session). 
// While this check is happening, isLoading will be true, allowing you to show a 
// loading screen or spinner. Once you know whether a user is logged in or not, 
// you'll set it to false.
export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => { console.log('AuthContext: token changed:', !!userToken); }, [userToken]);
    useEffect(() => { console.log('AuthContext: UserToken now is:', userToken); }, [userToken]);

    // Load token on app start (restore session)
    useEffect(() => {
        const bootstrapAsync = async () => {
            console.log('AuthContext: bootstrapAsync');
            try {
                const storedToken = await SecureStore.getItemAsync(TOEKN_KEY);
                if (storedToken) {
                    setUserToken(storedToken); // This should trigger re-render of index.js
                }
            } catch (err) {
                console.warn('Failed to restore token', err);
            } finally {
                setIsLoading(false);
            }
        };
        bootstrapAsync();
    }, []);

    // Login: call backend, get the token and store it SecureStore, update user token
    // useCallback will prevent the child component to be re-rendered if the dependencies didn't change
    const login = useCallback(async (email, password) => {
        if (!email || !password) {
            throw new Error('Email and password are required.');
        }
        setIsLoading(true);
        try {
            const res = await apiClient.post('/auth/login', {email, password}); // { email, password } will be the req.body
            const token = res?.data?.token; // The token is added by the apiClient.interceptor
            if (!token) {
                console.log(`AuthContext: error: setUserToken ${token}`)
                throw new Error('Login response missing token.');
            }

            await SecureStore.setItemAsync(TOEKN_KEY, token);
            setUserToken(token); // This should trigger re-render of index.js
            console.log(`AuthContext.login: Successfully setUserToken(${token})`);
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Unable to log in. Please try again.';
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Logout: clear token from secure storage and state
    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await SecureStore.deleteItemAsync(TOEKN_KEY);
            setUserToken(null);
            console.log('AuthContext.logout: setUserToken(null)');
        } catch (err) {
            console.warn('Failed to clear token', err);
            // Even if SecureStore fails, ensure app state resets
            setUserToken(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Register
    const register = useCallback(async (username, email, password) => {
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }
        setIsLoading(true);
        try {
            await apiClient.post('/auth/register', {username, email, password});
            
            // Optional (recommended UX): auto login after registration.
            const res = await apiClient.post('auth/login', { email, password});
            const token = res?.data?.token;
            if (!token) {
                return;
            }

            await SecureStore.setItemAsync(TOEKN_KEY, token);
            setUserToken(token);
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Unable to register. Please try again.';
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ userToken, isLoading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    )
};

// This is where the magic happens. The AuthProvider returns a component called AuthContext.Provider.

// The 'value' prop is what gets broadcast to all components listening to this context. 
// Here, you're making an object containing the current userToken and isLoading state available globally, and the login() and logout() functions.

// {children} are rendered inside the provider, meaning your entire app gets access to this value.

export default AuthContext;