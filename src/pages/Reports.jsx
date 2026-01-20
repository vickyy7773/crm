import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Phone,
  Target,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';

const Reports = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    contacted: 0,
    interested: 0,
    converted: 0,
    notInterested: 0,
    callBack: 0,
    wrongNumber: 0
  });
  const [telecallerStats, setTelecallerStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, today, week, month

  useEffect(() => {
    fetchReportsData();
  }, [timeRange]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);

      // Fetch all leads
      const leadsResponse = await fetch(`${API_URL}/leads`);
      const leadsData = await leadsResponse.json();

      if (leadsData.success) {
        const leads = leadsData.data;

        // Calculate stats
        const newStats = {
          totalLeads: leads.length,
          newLeads: leads.filter(l => l.status === 'New').length,
          contacted: leads.filter(l => l.status === 'Contacted').length,
          interested: leads.filter(l => l.status === 'Interested').length,
          converted: leads.filter(l => l.status === 'Converted').length,
          notInterested: leads.filter(l => l.status === 'Not Interested').length,
          callBack: leads.filter(l => l.status === 'Call Back').length,
          wrongNumber: leads.filter(l => l.status === 'Wrong Number').length
        };

        setStats(newStats);
      }

      // Fetch telecaller comparison data
      const telecallerResponse = await fetch(`${API_URL}/users/telecallers/comparison`);
      const telecallerData = await telecallerResponse.json();

      if (telecallerData.success) {
        setTelecallerStats(telecallerData.data.slice(0, 5)); // Top 5
      }

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    alert('Export functionality coming soon!');
  };

  const conversionRate = stats.totalLeads > 0
    ? ((stats.converted / stats.totalLeads) * 100).toFixed(2)
    : 0;

  const contactedRate = stats.totalLeads > 0
    ? (((stats.contacted + stats.interested + stats.converted) / stats.totalLeads) * 100).toFixed(2)
    : 0;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track performance and analyze trends</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReportsData}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm"
          >
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Leads */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users size={40} className="opacity-70" />
            <span className="text-sm bg-blue-400/30 px-3 py-1 rounded-full">Total</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.totalLeads}</p>
          <p className="text-blue-100 text-sm">Total Leads</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target size={40} className="opacity-70" />
            <span className="text-sm bg-green-400/30 px-3 py-1 rounded-full">Rate</span>
          </div>
          <p className="text-4xl font-bold mb-1">{conversionRate}%</p>
          <p className="text-green-100 text-sm">Conversion Rate</p>
        </div>

        {/* Contacted */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Phone size={40} className="opacity-70" />
            <span className="text-sm bg-purple-400/30 px-3 py-1 rounded-full">Active</span>
          </div>
          <p className="text-4xl font-bold mb-1">{contactedRate}%</p>
          <p className="text-purple-100 text-sm">Contact Rate</p>
        </div>

        {/* Converted */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={40} className="opacity-70" />
            <span className="text-sm bg-orange-400/30 px-3 py-1 rounded-full">Success</span>
          </div>
          <p className="text-4xl font-bold mb-1">{stats.converted}</p>
          <p className="text-orange-100 text-sm">Conversions</p>
        </div>
      </div>

      {/* Lead Status Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-blue-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Lead Status Breakdown</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* New */}
          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🆕</span>
              <span className="text-sm font-semibold text-blue-600">New</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.newLeads}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.newLeads / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          {/* Contacted */}
          <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📞</span>
              <span className="text-sm font-semibold text-yellow-600">Contacted</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.contacted}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.contacted / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          {/* Interested */}
          <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⭐</span>
              <span className="text-sm font-semibold text-purple-600">Interested</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.interested}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.interested / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          {/* Call Back */}
          <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-semibold text-orange-600">Call Back</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.callBack}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.callBack / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          {/* Not Interested */}
          <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">✖</span>
              <span className="text-sm font-semibold text-gray-600">Not Interested</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.notInterested}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.notInterested / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          {/* Wrong Number */}
          <div className="border-2 border-red-200 bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📵</span>
              <span className="text-sm font-semibold text-red-600">Wrong Number</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.wrongNumber}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.wrongNumber / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          {/* Converted */}
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">✅</span>
              <span className="text-sm font-semibold text-green-600">Converted</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.converted}</p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalLeads > 0 ? ((stats.converted / stats.totalLeads) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="text-green-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Top Performing Telecallers</h2>
        </div>

        {telecallerStats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="mx-auto mb-2 text-gray-300" size={48} />
            <p>No telecaller data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {telecallerStats.map((telecaller, index) => (
              <div
                key={telecaller.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{telecaller.name}</p>
                    <p className="text-sm text-gray-500">{telecaller.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{telecaller.totalCalls}</p>
                    <p className="text-xs text-gray-500">Total Calls</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{telecaller.interestedPercentage}%</p>
                    <p className="text-xs text-gray-500">Interested</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{telecaller.negativePercentage}%</p>
                    <p className="text-xs text-gray-500">Negative</p>
                  </div>
                  {telecaller.abuseFlag && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Flagged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <Calendar size={32} className="mb-3 opacity-80" />
          <h3 className="text-lg font-bold mb-2">Daily Stats History</h3>
          <p className="text-blue-100 text-sm mb-4">View historical performance trends</p>
          <button
            onClick={() => window.location.href = '/admin/daily-stats'}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all"
          >
            View History
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <Users size={32} className="mb-3 opacity-80" />
          <h3 className="text-lg font-bold mb-2">Manage Users</h3>
          <p className="text-green-100 text-sm mb-4">Add or manage telecaller accounts</p>
          <button
            onClick={() => window.location.href = '/users/all'}
            className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-all"
          >
            Manage Users
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <Target size={32} className="mb-3 opacity-80" />
          <h3 className="text-lg font-bold mb-2">View All Leads</h3>
          <p className="text-purple-100 text-sm mb-4">Manage and assign leads to telecallers</p>
          <button
            onClick={() => window.location.href = '/leads'}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-all"
          >
            View Leads
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
