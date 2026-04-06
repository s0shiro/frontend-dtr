import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Frontend App URL for proxied better-auth requests
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  
  // Enable cross-domain cookies for decoupled frontend/backend
  // Required for sending cookies to backend on different origin
  fetchOptions: {
    credentials: 'include', // Send cookies with all requests
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
