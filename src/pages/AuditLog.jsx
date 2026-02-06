import { useState, useEffect } from 'react';
import { FileText, Filter, Search, User, Activity, Calendar, Eye } from 'lucide-react';
import API_URL from '../config/api';

const AuditLog = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0
  });
  const [expandedLog, setExpandedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
    fetchStats();
  }, [filters, pagination.offset]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit,
        offset: pagination.offset,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      });

      const response = await fetch(`${API_URL}/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data);
        setPagination(prev => ({ ...prev, total: data.pagination.total }));
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/audit-logs/stats`);
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    }
  };

  const getActionColor = (action) => {
    const colors = {
      'CREATE': 'bg-green-100 text-green-700',
      'UPDATE': 'bg-blue-100 text-blue-700',
      'DELETE': 'bg-red-100 text-red-700',
      'LOGIN': 'bg-purple-100 text-purple-700',
      'LOGOUT': 'bg-gray-100 text-gray-700'
    };
    return colors[action] || 'bg-gray-100 text-gray-700';
  };

  const getEntityIcon = (entityType) => {
    const icons = {
      'Lead': '🎯',
      'User': '👤',
      'CallHistory': '📞',
      'Auth': '🔐',
      'Setting': '⚙️'
    };
    return icons[entityType] || '📄';
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-gray-500 text-xs md:text-base mt-1">Track all system activities and user actions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <Activity size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{stats.todayCount}</h3>
            <p className="text-blue-100 text-xs md:text-sm">Actions Today</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <Calendar size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{stats.last24HoursCount}</h3>
            <p className="text-purple-100 text-xs md:text-sm">Last 24 Hours</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <FileText size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{stats.actionsByType.length}</h3>
            <p className="text-pink-100 text-xs md:text-sm">Action Types</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <User size={20} className="md:w-6 md:h-6" />
            </div>
            <h3 className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{stats.mostActiveUsers.length}</h3>
            <p className="text-green-100 text-xs md:text-sm">Active Users</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-6 shadow-lg border border-gray-100">
        <div className="flex items-center gap-2 mb-3 md:mb-4">
          <Filter size={16} className="text-gray-600 md:w-5 md:h-5" />
          <h3 className="text-sm md:text-lg font-bold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
            />
          </div>

          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="px-3 md:px-4 py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>

          <select
            value={filters.entityType}
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
            className="px-3 md:px-4 py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
          >
            <option value="">All Entities</option>
            <option value="Lead">Lead</option>
            <option value="User">User</option>
            <option value="CallHistory">Call History</option>
            <option value="Auth">Auth</option>
            <option value="Setting">Setting</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 md:px-4 py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 md:px-4 py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-3 md:p-6 border-b border-gray-200">
          <h3 className="text-sm md:text-lg font-bold text-gray-900">Audit Trail</h3>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Showing {logs.length} of {pagination.total} records
          </p>
        </div>

        {loading ? (
          <div className="p-8 md:p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm md:text-base">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 md:p-12 text-center text-gray-500">
            <FileText size={40} className="mx-auto mb-3 text-gray-300 md:w-12 md:h-12" />
            <p className="font-medium text-sm md:text-base">No audit logs found</p>
            <p className="text-xs md:text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">Time</th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900">User</th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-900">Action</th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-900 hidden md:table-cell">Entity</th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-left text-xs md:text-sm font-semibold text-gray-900 hidden lg:table-cell">IP Address</th>
                  <th className="px-3 md:px-6 py-2 md:py-4 text-center text-xs md:text-sm font-semibold text-gray-900">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <div className="text-xs md:text-sm text-gray-900">{log.time_ago}</div>
                        <div className="text-[10px] md:text-xs text-gray-500 hidden md:block">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-purple-600 md:w-4 md:h-4" />
                          </div>
                          <span className="text-xs md:text-sm font-medium text-gray-900 truncate max-w-[60px] md:max-w-none">{log.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-center">
                        <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-semibold ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-center hidden md:table-cell">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <span className="text-sm md:text-lg">{getEntityIcon(log.entity_type)}</span>
                          <span className="text-xs md:text-sm text-gray-700">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-[10px] md:text-xs text-gray-500">#{log.entity_id}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-600 font-mono hidden lg:table-cell">{log.ip_address || '-'}</td>
                      <td className="px-3 md:px-6 py-2 md:py-4 text-center">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="p-1.5 md:p-2 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <Eye size={14} className="text-purple-600 md:w-[18px] md:h-[18px]" />
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr>
                        <td colSpan="6" className="px-3 md:px-6 py-3 md:py-4 bg-gray-50">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 text-xs md:text-sm">Details:</h4>
                            <pre className="bg-white p-2 md:p-4 rounded-lg border border-gray-200 text-[10px] md:text-sm overflow-x-auto">
                              {JSON.stringify(JSON.parse(log.details || '{}'), null, 2)}
                            </pre>
                            <div className="text-[10px] md:text-xs text-gray-500">
                              <strong>User Agent:</strong> <span className="break-all">{log.user_agent || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="p-3 md:p-4 border-t border-gray-200 flex items-center justify-between gap-2">
            <button
              onClick={handlePrevPage}
              disabled={pagination.offset === 0}
              className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-xs md:text-sm text-gray-600">
              Page {Math.floor(pagination.offset / pagination.limit) + 1} of{' '}
              {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
