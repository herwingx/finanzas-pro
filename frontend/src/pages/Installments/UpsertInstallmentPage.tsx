import React from 'react';
import { Navigate } from 'react-router-dom';

const UpsertInstallmentPage: React.FC = () => {
    return <Navigate to="/installments?action=new" replace />;
};

export default UpsertInstallmentPage;