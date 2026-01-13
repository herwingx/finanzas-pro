import React from 'react';
import { Navigate } from 'react-router-dom';

const NewRecurringPage: React.FC = () => {
  return <Navigate to="/recurring?action=new" replace />;
};

export default NewRecurringPage;