import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Backend API URL - points to Express server (port 8080 in dev)
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  
  // Enable cross-domain cookies for decoupled frontend/backend
  // Required for sending cookies to backend on different origin
  fetchOptions: {
    credentials: 'include', // Send cookies with all requests
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
