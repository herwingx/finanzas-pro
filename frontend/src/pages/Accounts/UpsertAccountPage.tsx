import React from 'react';
import { Navigate } from 'react-router-dom';

const UpsertAccountPage: React.FC = () => {
    return <Navigate to="/accounts?action=new" replace />;
};

export default UpsertAccountPage;