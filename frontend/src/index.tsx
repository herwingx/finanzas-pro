import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

// Register PWA Service Worker with update prompt
const updateSW = registerSW({
  onNeedRefresh() {
    // Show persistent toast with update button
    toast('Nueva versión disponible', {
      description: 'Actualiza para obtener las últimas mejoras',
      duration: Infinity, // Stay until user acts
      action: {
        label: 'Actualizar',
        onClick: () => {
          updateSW(true); // Force update and reload
        },
      },
      cancel: {
        label: 'Después',
        onClick: () => {
          // User dismissed, toast will close
          console.log('Update postponed by user');
        },
      },
    });
  },
  onOfflineReady() {
    toast.success('App lista para usar sin conexión', {
      duration: 3000,
    });
  },
  // Check for updates every 60 seconds when online
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 1000); // Check every minute
    }
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
