import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to user if a new version is available (optional for now, autoUpdate handles basics)
    // For now we just let it handle itself, but logging is good
    console.log('New content available, click on reload button to update.');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Cache data for 5 minutes before garbage collection
      gcTime: 5 * 60 * 1000,
      // Always refetch when window regains focus
      refetchOnWindowFocus: true,
      // Refetch when component mounts if data is stale
      refetchOnMount: true,
      // Retry failed requests 2 times
      retry: 2,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
