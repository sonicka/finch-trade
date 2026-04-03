import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../context/UserProvider';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const user = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
