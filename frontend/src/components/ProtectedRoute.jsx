import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple protected wrapper: checks for a token in localStorage and redirects to login if missing
const ProtectedRoute = ({ children }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
