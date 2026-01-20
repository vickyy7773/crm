import { useState, useEffect } from 'react';
import { Bell, Target, Users, BarChart3, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import API_URL from '../config/api';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Fetch notifications from API
  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/notifications?userId=${user.id}&limit=100`);
      const data = await response.json();

      if (data.success) {
        // Map API data to component format
        const mappedNotifications = data.data.map(notif => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          time: notif.time_ago,
          date: notif.formatted_date,
          unread: notif.unread,
          leadId: notif.lead_id,
          leadName: notif.lead_name
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAsRead = async (id) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, unread: false } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      try {
        const response = await fetch(`${API_URL}/notifications/clear-all?userId=${user.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error clearing all notifications:', error);
      }
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return n.unread;
    if (filter === 'read') return !n.unread;
    return true;
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_lead':
        return <Target size={20} className="text-green-600" />;
      case 'assignment':
        return <Users size={20} className="text-purple-600" />;
      case 'status_change':
        return <BarChart3 size={20} className="text-blue-600" />;
      default:
        return <Bell size={20} className="text-gray-600" />;
    }
  };

  const getNotificationBgColor = (type) => {
    switch (type) {
      case 'new_lead':
        return 'bg-green-100';
      case 'assignment':
        return 'bg-purple-100';
      case 'status_change':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell size={32} className="text-purple-600" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-2">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all flex items-center gap-2"
              >
                <Check size={18} />
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 font-semibold transition-all ${
              filter === 'all'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-3 font-semibold transition-all ${
              filter === 'unread'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-6 py-3 font-semibold transition-all ${
              filter === 'read'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </h3>
          <p className="text-gray-600">
            {filter === 'all'
              ? "We'll notify you when something arrives"
              : `You don't have any ${filter} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all ${
                notification.unread ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getNotificationBgColor(notification.type)} flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {notification.title}
                        {notification.unread && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </h3>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {notification.unread && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                          title="Mark as read"
                        >
                          <Check size={18} className="text-gray-400 group-hover:text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-gray-400 group-hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{notification.date}</span>
                    <span>•</span>
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
