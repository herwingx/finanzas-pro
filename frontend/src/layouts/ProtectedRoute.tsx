import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // You could add token validation logic here if needed
    // For example, decode the token and check its expiration

    return <Outlet />;
};

export default ProtectedRoute;