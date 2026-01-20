import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight,
  Phone, Clock
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
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 text-lg">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bgColor} p-4 rounded-xl`}>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-semibold ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {stat.isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-2">{stat.title}</h3>
            <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Lead Pipeline</h2>
            <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm">View All</button>
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
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">68%</div>
              <div className="text-sm text-gray-600 mt-1">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">24h</div>
              <div className="text-sm text-gray-600 mt-1">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">4.8</div>
              <div className="text-sm text-gray-600 mt-1">Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">Ready to Import Leads?</h3>
          <p className="text-white/90 mb-6">Upload your CSV file and start managing your leads efficiently.</p>
          <button className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105">
            Upload CSV Now
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
