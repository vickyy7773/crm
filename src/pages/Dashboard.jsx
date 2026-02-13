import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight,
  Phone, Clock, X, Calendar, MapPin, User
} from 'lucide-react';
import TelecallerComparisonWidget from '../components/TelecallerComparisonWidget';
import DailyStatsHistoryWidget from '../components/DailyStatsHistoryWidget';

import API_URL from '../config/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [leadsProgress, setLeadsProgress] = useState([]);
  const [showFollowupsModal, setShowFollowupsModal] = useState(false);
  const [pendingFollowups, setPendingFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data in parallel
      const [statsRes, activitiesRes, progressRes] = await Promise.all([
        fetch(`${API_URL}/dashboard/stats`),
        fetch(`${API_URL}/dashboard/activities?limit=5`),
        fetch(`${API_URL}/dashboard/leads-progress`)
      ]);

      const statsData = await statsRes.json();
      const activitiesData = await activitiesRes.json();
      const progressData = await progressRes.json();

      if (statsData.success) {
        setDashboardStats(statsData.data);
      }

      if (activitiesData.success) {
        setRecentActivities(activitiesData.data);
      }

      if (progressData.success) {
        setLeadsProgress(progressData.data);
      }
    } catch (error) {
      // Error silently handled
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending follow-ups list
  const fetchPendingFollowups = async () => {
    try {
      setFollowupsLoading(true);
      const response = await fetch(`${API_URL}/dashboard/pending-followups`);
      const data = await response.json();
      if (data.success) {
        setPendingFollowups(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending follow-ups:', error);
    } finally {
      setFollowupsLoading(false);
    }
  };

  // Handle clicking on Pending Follow-ups card
  const handleFollowupsClick = () => {
    setShowFollowupsModal(true);
    fetchPendingFollowups();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Map dashboard stats to display format
  const stats = dashboardStats ? [
    {
      title: 'Total Leads',
      value: dashboardStats.totalLeads.toLocaleString(),
      change: `${dashboardStats.changes.leads > 0 ? '+' : ''}${dashboardStats.changes.leads}%`,
      isPositive: dashboardStats.changes.leads >= 0,
      icon: Users,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Conversions',
      value: dashboardStats.conversions.toLocaleString(),
      change: `${dashboardStats.changes.conversions > 0 ? '+' : ''}${dashboardStats.changes.conversions}%`,
      isPositive: dashboardStats.changes.conversions >= 0,
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Pending Follow-ups',
      value: dashboardStats.pendingFollowups.toLocaleString(),
      change: 'Upcoming',
      isPositive: true,
      icon: Clock,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Active Users',
      value: dashboardStats.activeUsers.toLocaleString(),
      change: 'Team members',
      isPositive: true,
      icon: BarChart3,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
  ] : [];

  // Map leads progress with colors
  const progressWithColors = leadsProgress.map(item => ({
    ...item,
    color: item.status === 'New' ? 'bg-blue-500' :
           item.status === 'Contacted' ? 'bg-yellow-500' :
           item.status === 'Interested' ? 'bg-purple-500' :
           'bg-green-500'
  }));

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 text-sm md:text-lg">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.title === 'Pending Follow-ups' ? handleFollowupsClick : undefined}
            className={`bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${stat.title === 'Pending Follow-ups' ? 'cursor-pointer ring-2 ring-purple-200 hover:ring-purple-400' : ''}`}
          >
            <div className="flex items-start justify-between mb-2 md:mb-4">
              <div className={`${stat.bgColor} p-2 md:p-4 rounded-lg md:rounded-xl`}>
                <stat.icon className={stat.iconColor} size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs md:text-sm font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.isPositive ? <ArrowUpRight size={12} className="md:w-4 md:h-4" /> : <ArrowDownRight size={12} className="md:w-4 md:h-4" />}
                <span className="hidden md:inline">{stat.change}</span>
              </div>
            </div>
            <h3 className="text-gray-600 text-xs md:text-sm font-semibold mb-1 md:mb-2">{stat.title}</h3>
            <p className="text-2xl md:text-4xl font-bold text-gray-900">{stat.value}</p>
            {stat.title === 'Pending Follow-ups' && (
              <p className="text-xs text-purple-600 mt-2 font-medium">Click to view details</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Lead Progress */}
        <div className="lg:col-span-2 bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900">Lead Pipeline</h2>
            <button className="text-purple-600 hover:text-purple-700 font-semibold text-xs md:text-sm">View All</button>
          </div>

          <div className="space-y-5">
            {progressWithColors.map((lead, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-semibold">{lead.status}</span>
                  <span className="text-gray-900 font-bold">{lead.count} leads</span>
                </div>
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full ${lead.color} rounded-full transition-all duration-500`}
                    style={{ width: `${lead.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-gray-900">68%</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-gray-900">24h</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-bold text-gray-900">4.8</div>
              <div className="text-xs md:text-sm text-gray-600 mt-1">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Recent Activity</h2>

          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
                    <Phone className="text-white" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {activity.user}
                    </p>
                    <p className="text-xs text-gray-600">
                      {activity.action} - {activity.lead_name}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{activity.time_ago}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Phone size={48} className="mx-auto text-gray-300 mb-2" />
                <p>No recent activities</p>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/activity')}
            className="w-full mt-4 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View All Activity →
          </button>
        </div>
      </div>

      {/* Telecaller Performance Comparison */}
      <div className="mt-8">
        <TelecallerComparisonWidget />
      </div>

      {/* Daily Stats History */}
      <div className="mt-8">
        <DailyStatsHistoryWidget />
      </div>

      {/* Bottom Section - Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-6">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 text-white">
          <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">Ready to Import Leads?</h3>
          <p className="text-white/90 text-sm md:text-base mb-4 md:mb-6">Upload your CSV file and start managing your leads efficiently.</p>
          <button className="bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl text-sm md:text-base font-bold hover:bg-gray-100 transition-all transform hover:scale-105">
            Upload CSV Now
          </button>
        </div>

      </div>

      {/* Pending Follow-ups Modal */}
      {showFollowupsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Pending Follow-ups</h2>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm text-white">
                  {pendingFollowups.length} leads
                </span>
              </div>
              <button
                onClick={() => setShowFollowupsModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
              {followupsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                </div>
              ) : pendingFollowups.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pendingFollowups.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setShowFollowupsModal(false);
                        navigate(`/leads`);
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              lead.status === 'Interested' ? 'bg-purple-100 text-purple-700' :
                              lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-700' :
                              lead.status === 'New' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lead.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {lead.phone}
                            </span>
                            {lead.city && (
                              <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {lead.city}
                              </span>
                            )}
                            {lead.assigned_to_name && (
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {lead.assigned_to_name}
                              </span>
                            )}
                          </div>
                          {lead.remark && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">{lead.remark}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex flex-col items-center px-3 py-2 rounded-lg ${
                            formatDate(lead.next_followup_date) === 'Today' ? 'bg-red-100 text-red-700' :
                            formatDate(lead.next_followup_date) === 'Tomorrow' ? 'bg-orange-100 text-orange-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span className="font-medium text-sm">{formatDate(lead.next_followup_date)}</span>
                            </div>
                            {formatTime(lead.next_followup_date) && (
                              <div className="flex items-center gap-1 text-xs mt-0.5">
                                <Clock size={12} />
                                <span>{formatTime(lead.next_followup_date)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Clock size={48} className="mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No pending follow-ups</p>
                  <p className="text-sm">All follow-ups are up to date!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
