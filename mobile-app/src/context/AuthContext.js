// Best practice: create an auth context to manage the user's authentication state across the entire app.
// A Context is a React feature for managing global state, 
// like the current user's authentication status. This avoids passing props down through many levels.

import React, { createContext, useState } from 'react';

// Think of this AuthContext as the address where the globla auth data will live.
const AuthContext = createContext();

// Inside the AuthProvider, useState is used to create two important pieces of state:
// userToken: This will hold the JWT you receive from your backend's /login endpoint. 
// It starts as null because when the app first loads, the user is not logged in.

// isLoading: This is a crucial piece of UI state. When the app starts, you'll want to 
// check if a token is already saved on the device (from a previous session). 
// While this check is happening, isLoading will be true, allowing you to show a 
// loading screen or spinner. Once you know whether a user is logged in or not, 
// you'll set it to false.
export const AuthProvider = ({ children }) => {
    const [userToken, setUsetToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // We will add login/logout functions here

    return (
        <AuthContext.Provider value={{ userToken, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
};

// This is where the magic happens. The AuthProvider returns a component called AuthContext.Provider.

// The value prop is what gets broadcast to all components listening to this context. 
// Here, you're making an object containing the current userToken and isLoading state available globally.

// {children} are rendered inside the provider, meaning your entire app gets access to this value.

export default AuthContext;