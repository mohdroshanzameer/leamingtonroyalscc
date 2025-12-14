/**
 * App Component with Socket.IO Integration
 * 
 * LOCATION: cricket-club-frontend/src/App.jsx
 */

import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRouter from '@/components/app/router';
import { AuthProvider } from '@/components/app/providers/AuthProvider';
import { socketClient } from '@/components/api/socketClient';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Connect Socket.IO on app mount
    console.log('Connecting Socket.IO...');
    socketClient.connect();

    return () => {
      // Disconnect on unmount
      console.log('Disconnecting Socket.IO...');
      socketClient.disconnect();
    };
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </QueryClientProvider>
  );
}