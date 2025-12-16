import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SkeletonAppLoading } from '../components/Skeleton';

/**
 * GuestRoute - Inverse of ProtectedRoute
 * Redirects authenticated users away from public auth pages (login, register, etc.)
 * If user has a valid token, they get sent to the dashboard.
 */
const GuestRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        // No token = guest, allow access
        setIsAuthenticated(false);
        setIsChecking(false);
        return;
      }

      try {
        const res = await fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          // Token is valid, user is authenticated
          setIsAuthenticated(true);
        } else if (res.status === 401) {
          // Token invalid or expired, clean up and allow access
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        } else {
          // Other error, assume not authenticated
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Token validation check failed", error);
        // On error, assume not authenticated to allow access
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };

    validateToken();
  }, [token]);

  // Show loading skeleton while checking auth status
  if (isChecking) {
    return <SkeletonAppLoading />;
  }

  // If authenticated, redirect to home/dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If not authenticated, render the child route (login, register, etc.)
  return <Outlet />;
};

export default GuestRoute;
