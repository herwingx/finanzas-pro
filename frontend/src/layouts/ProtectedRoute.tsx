import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    const [isChecking, setIsChecking] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        // Quick check to prevent rendering before redirect
        setIsChecking(false);
    }, []);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="size-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // You could add token validation logic here if needed
    // For example, decode the token and check its expiration

    return <Outlet />;
};

export default ProtectedRoute;