import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SkeletonAppLoading } from '../components/Skeleton';

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
            <SkeletonAppLoading />
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;