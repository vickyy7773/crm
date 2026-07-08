import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSuperAdmin, isTelecaller, hasRole, ROLES } from '../utils/permissions';
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  Users,
  Target,
  ChevronRight,
  ChevronDown,
  LogOut,
  UserCircle,
  Search,
  Bell,
  Settings,
  Sparkles,
  Menu,
  X,
  Phone,
  Clock,
  Calendar,
  UserCheck,
  Award,
  TrendingUp,
  FileText,
  GraduationCap
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import API_URL from '../config/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [reportsOpen, setReportsOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications and unread count
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const [response, followupResponse] = await Promise.all([
        fetch(`${API_URL}/notifications?userId=${user.id}&limit=5`),
        fetch(`${API_URL}/notifications/followups-today?userId=${user.id}&userRole=${user.role}`)
      ]);

      const data = response.ok ? await response.json().catch(() => null) : null;
      const followupData = followupResponse.ok ? await followupResponse.json().catch(() => null) : null;

      let allNotifications = [];

      if (data?.success) {
        allNotifications = data.data.map(notif => ({
          id: `notif-${notif.id}`,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          time: notif.time_ago,
          unread: notif.unread,
          leadId: notif.lead_id
        }));
      }

      if (followupData?.success && followupData.data.length > 0) {
        const mappedFollowups = followupData.data.map(followup => ({
          id: `followup-${followup.id}`,
          type: 'followup',
          title: followup.title,
          message: followup.message,
          time: followup.time_ago,
          unread: true,
          leadId: followup.id
        }));
        allNotifications = [...allNotifications, ...mappedFollowups];
      }

      setNotifications(allNotifications.slice(0, 10));
      setUnreadCount(allNotifications.filter(n => n.unread).length);

    } catch {
      // Silently ignore — notifications are non-critical, will retry in 30s
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle view all notifications
  const handleViewAll = () => {
    setNotificationOpen(false);
    navigate('/notifications');
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (notificationOpen || profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationOpen, profileOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, children, hasSubmenu, isOpen, onClick }) => {
    const isActive = location.pathname === to;

    return (
      <div>
        {hasSubmenu ? (
          <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-white/10 rounded-xl mx-2 transition-all ${
              isActive ? 'bg-white/10 text-white' : ''
            }`}
            title={children}
          >
            <div className="flex items-center gap-3">
              <Icon size={20} />
              {!sidebarCollapsed && <span className="font-medium">{children}</span>}
            </div>
            {!sidebarCollapsed && (isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          </button>
        ) : (
          <Link
            to={to}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-white/10 rounded-xl mx-2 transition-all ${
              isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : ''
            }`}
            title={children}
          >
            <Icon size={20} />
            {!sidebarCollapsed && <span className="font-medium">{children}</span>}
          </Link>
        )}
      </div>
    );
  };

  const SubNavItem = ({ to, icon: Icon, children }) => {
    const isActive = location.pathname === to;

    if (sidebarCollapsed) return null;

    return (
      <Link
        to={to}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 pl-12 pr-4 py-3 text-gray-400 hover:bg-white/5 rounded-xl mx-2 transition-all ${
          isActive ? 'bg-white/10 text-white font-semibold' : ''
        }`}
      >
        <Icon size={18} />
        <span>{children}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72
        bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl transition-all duration-300
        fixed md:relative inset-y-0 left-0 z-50
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Brand Section */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex-shrink-0">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Pulse Education</h1>
              <p className="text-xs text-gray-400">ERP System</p>
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <UserCircle className="text-white" size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-sm truncate">{user?.name || 'Admin User'}</h3>
              <p className="text-xs text-gray-300">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto space-y-2">
          {/* Super Admin & Manager Menu */}
          {hasRole(user, [ROLES.SUPER_ADMIN, ROLES.MANAGER]) && (
            <>
              <NavItem to="/dashboard" icon={LayoutDashboard}>
                Dashboard
              </NavItem>

              <NavItem to="/leads" icon={Target}>
                Leads
              </NavItem>

              {/* Raw Leads merged into Leads page
              <NavItem to="/raw-leads" icon={Users}>
                Raw Leads
              </NavItem>
              */}

              <NavItem to="/assigned-leads" icon={UserCheck}>
                Assigned Leads
              </NavItem>

              <NavItem to="/converted-leads" icon={Award}>
                Converted Leads
              </NavItem>

              <NavItem to="/student-applications" icon={GraduationCap}>
                Student Applications
              </NavItem>

              {/* <NavItem to="/import" icon={Upload}>
                Import
              </NavItem> */}

              <NavItem to="/bulk-upload" icon={Upload}>
                Bulk Upload
              </NavItem>

              <NavItem
                icon={BarChart3}
                hasSubmenu
                isOpen={reportsOpen}
                onClick={() => setReportsOpen(!reportsOpen)}
              >
                Reports
              </NavItem>
              {reportsOpen && (
                <>
                  <SubNavItem to="/reports" icon={BarChart3}>
                    Reports
                  </SubNavItem>
                  <SubNavItem to="/analytics" icon={TrendingUp}>
                    Analytics
                  </SubNavItem>
                  <SubNavItem to="/admin/daily-stats" icon={Calendar}>
                    Daily Stats History
                  </SubNavItem>
                </>
              )}

              <NavItem
                icon={Users}
                hasSubmenu
                isOpen={usersOpen}
                onClick={() => setUsersOpen(!usersOpen)}
              >
                Users
              </NavItem>
              {usersOpen && (
                <>
                  <SubNavItem to="/users/all" icon={Users}>
                    All Users
                  </SubNavItem>
                  {isSuperAdmin(user) && (
                    <SubNavItem to="/users/add" icon={UserCircle}>
                      Add User
                    </SubNavItem>
                  )}
                </>
              )}

              {isSuperAdmin(user) && (
                <>
                  <NavItem to="/settings" icon={Settings}>
                    Settings
                  </NavItem>
                  <NavItem to="/audit-log" icon={FileText}>
                    Audit Log
                  </NavItem>
                </>
              )}
            </>
          )}

          {/* Telecaller Menu — shown to all non-Super Admin roles */}
          {!isSuperAdmin(user) && (
            <>
              <NavItem to="/telecaller/dashboard" icon={LayoutDashboard}>
                Dashboard
              </NavItem>

              <NavItem to="/telecaller/raw-leads" icon={Users}>
                Raw Leads
              </NavItem>

              <NavItem to="/telecaller/leads" icon={Phone}>
                My Leads
              </NavItem>

              <NavItem to="/telecaller/leads" icon={Clock}>
                Follow-ups
              </NavItem>

              <NavItem to="/converted-leads" icon={Award}>
                Converted Leads
              </NavItem>
            </>
          )}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all font-semibold"
            title="Logout"
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
            >
              <Menu size={24} className="text-gray-600" />
            </button>

            <div className="relative flex-1 max-w-xl hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search leads, contacts, or reports..."
                className="w-full pl-11 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Bell size={22} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{unreadCount}</span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="fixed sm:absolute top-16 sm:top-auto right-4 sm:right-0 mt-0 sm:mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[70vh] sm:max-h-[500px] overflow-hidden">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {/* Notifications List */}
                  <div className="overflow-y-auto max-h-[350px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">No notifications yet</p>
                        <p className="text-sm">We'll notify you when something arrives</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            notification.unread ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            setNotificationOpen(false);
                            if (notification.leadId) {
                              // Navigate to leads page and highlight the lead
                              const role = user?.role;
                              if (role === 'Telecaller') {
                                navigate(`/telecaller/leads?highlight=${notification.leadId}`);
                              } else {
                                navigate(`/leads?highlight=${notification.leadId}`);
                              }
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              notification.type === 'new_lead'
                                ? 'bg-green-100'
                                : notification.type === 'assignment'
                                ? 'bg-purple-100'
                                : notification.type === 'followup'
                                ? 'bg-orange-100'
                                : 'bg-blue-100'
                            }`}>
                              {notification.type === 'new_lead' && <Target size={16} className="text-green-600" />}
                              {notification.type === 'assignment' && <Users size={16} className="text-purple-600" />}
                              {notification.type === 'followup' && <Clock size={16} className="text-orange-600" />}
                              {notification.type === 'status_change' && <BarChart3 size={16} className="text-blue-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                                {notification.unread && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                      >
                        Mark all as read
                      </button>
                      <button
                        onClick={handleViewAll}
                        className="text-sm text-gray-600 hover:text-gray-700 font-semibold transition-colors"
                      >
                        View all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Settings */}
            <Link to="/settings" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings size={22} className="text-gray-600" />
            </Link>

            {/* User Avatar */}
            <div className="relative" ref={profileRef}>
              <div
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
              >
                <UserCircle className="text-white" size={24} />
              </div>

              {/* Profile Card */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  {/* User Info Section */}
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                        <UserCircle className="text-white" size={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{user?.name || 'Admin User'}</h3>
                        <p className="text-sm text-purple-100 truncate">{user?.email || 'admin@pulseeducation.com'}</p>
                      </div>
                    </div>
                    <div className="mt-3 inline-block px-3 py-1 bg-white/20 backdrop-blur-lg rounded-full border border-white/30">
                      <p className="text-xs font-semibold">{user?.role || 'Admin'}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-3 space-y-1">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg transition-colors text-left group"
                    >
                      <UserCircle size={20} className="text-gray-600 group-hover:text-purple-600" />
                      <span className="font-medium text-gray-900 group-hover:text-purple-600">View Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/leads');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors text-left group"
                    >
                      <Target size={20} className="text-gray-600 group-hover:text-blue-600" />
                      <span className="font-medium text-gray-900 group-hover:text-blue-600">Qualified Leads</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/activity');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 rounded-lg transition-colors text-left group"
                    >
                      <BarChart3 size={20} className="text-gray-600 group-hover:text-green-600" />
                      <span className="font-medium text-gray-900 group-hover:text-green-600">My Activity</span>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all font-semibold"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
