import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    const [isChecking, setIsChecking] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setIsChecking(false);
                return;
            }

            try {
                const res = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.status === 401) {
                    // Token invalid or user deleted
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    return;
                }
            } catch (error) {
                console.error("Token validation check failed", error);
            } finally {
                setIsChecking(false);
            }
        };

        validateToken();
    }, [token]);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="size-8 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;