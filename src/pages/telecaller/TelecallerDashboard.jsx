import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Phone, Users, Clock, ThumbsUp, ThumbsDown, AlertCircle, TrendingUp } from 'lucide-react';
import API_URL from '../../config/api';

const TelecallerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAssigned: 0,
    totalCalls: 0,
    interestedLeads: 0,
    conversions: 0,
    conversionRate: 0
  });
  const [followUps, setFollowUps] = useState({
    today: [],
    overdue: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch user statistics
      const statsRes = await fetch(`${API_URL}/users/${user.id}/statistics`);
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      // Fetch today's and overdue follow-ups
      const followUpsRes = await fetch(`${API_URL}/leads/follow-ups/${user.id}`);
      const followUpsData = await followUpsRes.json();

      if (followUpsData.success) {
        setFollowUps(followUpsData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-blue-100">Here's your performance overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Assigned */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Assigned</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalAssigned}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Today's Calls */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Calls</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalCalls}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Phone className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        {/* Pending Follow-ups */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Follow-ups</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{followUps.total}</p>
              <p className="text-xs text-orange-600 mt-1">{followUps.overdue.length} overdue</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="text-orange-600" size={24} />
            </div>
          </div>
        </div>

        {/* Interested Leads */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Interested</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.interestedLeads}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <ThumbsUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-pink-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Conversion</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">{stats.conversions} converted</p>
            </div>
            <div className="bg-pink-100 p-3 rounded-lg">
              <TrendingUp className="text-pink-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Follow-ups Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={24} />
            Today's Follow-ups
          </h2>
          <button
            onClick={() => navigate('/telecaller/leads')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Leads
          </button>
        </div>

        {followUps.total === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No follow-ups scheduled for today</p>
            <p className="text-gray-400 text-sm mt-2">Great job staying on top of your leads!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue Follow-ups */}
            {followUps.overdue.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Overdue ({followUps.overdue.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Destination</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Follow-up Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-red-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {followUps.overdue.map((lead) => (
                        <tr key={lead.id} className="bg-red-50 hover:bg-red-100 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                              {lead.phone}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lead.destination || '-'}</td>
                          <td className="px-4 py-3 text-sm text-red-600 font-semibold">
                            {formatDate(lead.next_followup_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => navigate('/telecaller/leads')}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Call Now →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Today's Follow-ups */}
            {followUps.today.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  Today ({followUps.today.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-green-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">Destination</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">Follow-up Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-green-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-100">
                      {followUps.today.map((lead) => (
                        <tr key={lead.id} className="hover:bg-green-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{lead.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                              {lead.phone}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lead.destination || '-'}</td>
                          <td className="px-4 py-3 text-sm text-green-600 font-semibold">
                            {formatDate(lead.next_followup_date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => navigate('/telecaller/leads')}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Call Now →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/telecaller/leads')}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105"
        >
          <Phone className="mb-3" size={32} />
          <h3 className="text-lg font-bold">My Leads</h3>
          <p className="text-blue-100 text-sm mt-1">View & manage your assigned leads</p>
        </button>

        <button
          onClick={() => navigate('/telecaller/leads')}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105"
        >
          <Clock className="mb-3" size={32} />
          <h3 className="text-lg font-bold">Follow-ups</h3>
          <p className="text-green-100 text-sm mt-1">Check pending follow-ups</p>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105"
        >
          <TrendingUp className="mb-3" size={32} />
          <h3 className="text-lg font-bold">My Performance</h3>
          <p className="text-purple-100 text-sm mt-1">View detailed statistics</p>
        </button>
      </div>
    </div>
  );
};

export default TelecallerDashboard;
