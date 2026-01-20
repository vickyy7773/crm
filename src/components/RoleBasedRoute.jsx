import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasRole, getDashboardRoute } from '../utils/permissions';

/**
 * RoleBasedRoute Component
 * Protects routes based on user roles
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array<string>} props.allowedRoles - Array of allowed role names
 * @returns {React.ReactNode}
 */
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!hasRole(user, allowedRoles)) {
    // Redirect to user's appropriate dashboard
    const dashboardRoute = getDashboardRoute(user);
    return <Navigate to={dashboardRoute} replace />;
  }

  // User is authenticated and has required role
  return children;
};

export default RoleBasedRoute;
