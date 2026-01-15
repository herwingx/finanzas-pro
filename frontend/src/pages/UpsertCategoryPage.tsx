import React from 'react';
import { Navigate } from 'react-router-dom';

const UpsertCategoryPage: React.FC = () => {
  return <Navigate to="/categories?action=new" replace />;
};

export default UpsertCategoryPage;
