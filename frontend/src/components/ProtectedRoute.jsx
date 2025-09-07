import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Protected wrapper: consults AuthContext for authentication state
const ProtectedRoute = ({ children }) => {
  const auth = useAuth();
  if (!auth || !auth.isAuthenticated) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
