import React from 'react';
import { Navigate } from 'react-router-dom';

const LoanFormPage: React.FC = () => {
  return <Navigate to="/loans?action=new" replace />;
};

export default LoanFormPage;