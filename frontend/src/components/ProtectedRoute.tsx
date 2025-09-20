import { Navigate, Outlet } from 'react-router-dom';
import { getAccessToken } from '../api/apiClient';

export const ProtectedRoute = () => {
  const isAuthenticated = !!getAccessToken();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
