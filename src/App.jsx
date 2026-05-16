import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES } from './utils/permissions';
import RoleBasedRoute from './components/RoleBasedRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Import from './pages/Import';
import Leads from './pages/Leads';
import AssignedLeads from './pages/AssignedLeads';
import ConvertedLeads from './pages/ConvertedLeads';
import AllUsers from './pages/AllUsers';
import AddUser from './pages/AddUser';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import Analytics from './pages/Analytics';
import AuditLog from './pages/AuditLog';
import ApplyMBBS from './pages/ApplyMBBS';
import ApplyOtherCourses from './pages/ApplyOtherCourses';
import StudentApplications from './pages/StudentApplications';
import BulkUpload from './pages/BulkUpload';
import RawLeads from './pages/RawLeads';

// Admin Pages
import DailyStatsHistory from './pages/admin/DailyStatsHistory';

// Telecaller Pages
import TelecallerDashboard from './pages/telecaller/TelecallerDashboard';
import TelecallerLeads from './pages/telecaller/TelecallerLeads';
import TelecallerRawLeads from './pages/telecaller/TelecallerRawLeads';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Public Application Forms */}
          <Route path="/apply/mbbs" element={<ApplyMBBS />} />
          <Route path="/apply/other-courses" element={<ApplyOtherCourses />} />

          {/* Admin Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Super Admin & Manager Routes */}
            <Route path="dashboard" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <Dashboard />
              </RoleBasedRoute>
            } />
            <Route path="leads" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <Leads />
              </RoleBasedRoute>
            } />
            <Route path="raw-leads" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <RawLeads />
              </RoleBasedRoute>
            } />
            <Route path="assigned-leads" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.COUNSELLOR]}>
                <AssignedLeads />
              </RoleBasedRoute>
            } />
            <Route path="converted-leads" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.TELECALLER]}>
                <ConvertedLeads />
              </RoleBasedRoute>
            } />
            <Route path="import" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <Import />
              </RoleBasedRoute>
            } />
            <Route path="bulk-upload" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <BulkUpload />
              </RoleBasedRoute>
            } />
            <Route path="reports" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <Reports />
              </RoleBasedRoute>
            } />
            <Route path="analytics" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <Analytics />
              </RoleBasedRoute>
            } />
            <Route path="audit-log" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <AuditLog />
              </RoleBasedRoute>
            } />
            <Route path="users/all" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <AllUsers />
              </RoleBasedRoute>
            } />
            <Route path="users/add" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <AddUser />
              </RoleBasedRoute>
            } />
            <Route path="settings" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <Settings />
              </RoleBasedRoute>
            } />
            <Route path="admin/daily-stats" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <DailyStatsHistory />
              </RoleBasedRoute>
            } />
            <Route path="student-applications" element={
              <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.MANAGER]}>
                <StudentApplications />
              </RoleBasedRoute>
            } />

            {/* Telecaller Routes */}
            <Route path="telecaller/dashboard" element={
              <RoleBasedRoute allowedRoles={[ROLES.TELECALLER]}>
                <TelecallerDashboard />
              </RoleBasedRoute>
            } />
            <Route path="telecaller/raw-leads" element={
              <RoleBasedRoute allowedRoles={[ROLES.TELECALLER]}>
                <TelecallerRawLeads />
              </RoleBasedRoute>
            } />
            <Route path="telecaller/leads" element={
              <RoleBasedRoute allowedRoles={[ROLES.TELECALLER]}>
                <TelecallerLeads />
              </RoleBasedRoute>
            } />

            {/* Common Routes (All roles) */}
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="activity" element={<Activity />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
