import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

const NewTransaction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'expense';

  // Redirect to dashboard with same legacy params, which dashboard now handles
  return <Navigate to={`/?action=new&type=${type}`} replace />;
};

export default NewTransaction;