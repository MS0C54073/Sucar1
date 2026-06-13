import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSkeleton from './skeletons/DashboardSkeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'carwash' | 'driver' | 'client';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();

  // Show skeleton while loading (better UX than plain "Loading...")
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const allowed =
      user.role === role ||
      (role === 'admin' && user.role === 'subadmin');
    if (!allowed) {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
