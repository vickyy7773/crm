import { useState, useEffect } from 'react';
import API_URL from '../../config/api';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  Download,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const DailyStatsHistory = () => {
  const [statsHistory, setStatsHistory] = useState([]);
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);
  const [telecallerFilter, setTelecallerFilter] = useState('');
  const [summary, setSummary] = useState({ totalRecords: 0, flaggedRecords: 0 });

  useEffect(() => {
    fetchTelecallers();
  }, []);

  useEffect(() => {
    fetchStatsHistory();
  }, [daysFilter, telecallerFilter]);

  const fetchTelecallers = async () => {
    try {
      const response = await fetch(`${API_URL}/users?role=Telecaller`);
      const result = await response.json();
      if (result.success) {
        setTelecallers(result.data.filter(u => u.role === 'Telecaller'));
      }
    } catch (error) {
      console.error('Error fetching telecallers:', error);
    }
  };

  const fetchStatsHistory = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/users/daily-stats/history?days=${daysFilter}`;
      if (telecallerFilter) {
        url += `&telecallerId=${telecallerFilter}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setStatsHistory(result.data);
        setSummary(result.summary);
      }
    } catch (error) {
      console.error('Error fetching stats history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (statsHistory.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Date',
      'Telecaller Name',
      'Email',
      'Total Calls',
      'Contacted',
      'Interested',
      'Negative Outcomes',
      'Wrong Numbers',
      'Not Reachable',
      'Missed Followups',
      'Negative %',
      'Interested %',
      'Abuse Flag'
    ];

    const csvData = statsHistory.map(stat => [
      new Date(stat.date).toLocaleDateString('en-IN'),
      stat.telecaller_name,
      stat.telecaller_email,
      stat.total_calls,
      stat.contacted_count,
      stat.interested_count,
      stat.negative_outcome_count,
      stat.wrong_number_count,
      stat.not_reachable_count,
      stat.followups_missed,
      stat.negative_outcome_ratio,
      stat.interested_ratio,
      stat.abuse_flag ? 'Yes' : 'No'
    ]);

    const csv = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-stats-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPerformanceColor = (percentage, type) => {
    if (type === 'interested') {
      if (percentage >= 15) return 'text-green-600 bg-green-50';
      if (percentage >= 5) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }

    if (type === 'negative') {
      if (percentage >= 80) return 'text-red-600 bg-red-50';
      if (percentage >= 50) return 'text-yellow-600 bg-yellow-50';
      return 'text-green-600 bg-green-50';
    }

    return 'text-gray-600 bg-gray-50';
  };

  // Calculate aggregate stats
  const aggregateStats = {
    totalCalls: statsHistory.reduce((sum, s) => sum + s.total_calls, 0),
    totalInterested: statsHistory.reduce((sum, s) => sum + s.interested_count, 0),
    totalNegative: statsHistory.reduce((sum, s) => sum + s.negative_outcome_count, 0),
    avgInterestedRatio: statsHistory.length > 0
      ? (statsHistory.reduce((sum, s) => sum + parseFloat(s.interested_ratio), 0) / statsHistory.length).toFixed(2)
      : 0,
    avgNegativeRatio: statsHistory.length > 0
      ? (statsHistory.reduce((sum, s) => sum + parseFloat(s.negative_outcome_ratio), 0) / statsHistory.length).toFixed(2)
      : 0
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading stats history...</p>
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
          <h1 className="text-3xl font-bold text-gray-800">Daily Performance History</h1>
          <p className="text-gray-600 mt-1">Track telecaller performance trends over time</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Records</p>
              <p className="text-3xl font-bold">{summary.totalRecords}</p>
            </div>
            <BarChart3 size={40} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Total Calls</p>
              <p className="text-3xl font-bold">{aggregateStats.totalCalls}</p>
            </div>
            <Users size={40} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Avg Interested %</p>
              <p className="text-3xl font-bold">{aggregateStats.avgInterestedRatio}%</p>
            </div>
            <TrendingUp size={40} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Avg Negative %</p>
              <p className="text-3xl font-bold">{aggregateStats.avgNegativeRatio}%</p>
            </div>
            <TrendingDown size={40} className="opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Flagged Days</p>
              <p className="text-3xl font-bold">{summary.flaggedRecords}</p>
            </div>
            <AlertTriangle size={40} className="opacity-50" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <span className="font-semibold text-gray-700">Filters:</span>
          </div>

          {/* Days Filter */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
            >
              <option value={7}>Last 7 Days</option>
              <option value={15}>Last 15 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>

          {/* Telecaller Filter */}
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <select
              value={telecallerFilter}
              onChange={(e) => setTelecallerFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none cursor-pointer"
            >
              <option value="">All Telecallers</option>
              {telecallers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchStatsHistory}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {statsHistory.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No historical data available</p>
            <p className="text-gray-400 text-sm mt-2">
              Daily stats are generated automatically at 7 PM IST every day
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    Telecaller
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Total Calls
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Contacted
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    <TrendingUp size={14} className="inline mr-1" />
                    Interested %
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    <TrendingDown size={14} className="inline mr-1" />
                    Negative %
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Wrong Numbers
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Missed Followups
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statsHistory.map((stat) => (
                  <tr
                    key={`${stat.telecaller_id}-${stat.date}`}
                    className={`hover:bg-gray-50 transition-colors ${
                      stat.abuse_flag ? 'bg-red-50 border-l-4 border-red-500' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(stat.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{stat.telecaller_name}</p>
                        <p className="text-xs text-gray-500">{stat.telecaller_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-gray-900">{stat.total_calls}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-blue-600">{stat.contacted_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(
                          parseFloat(stat.interested_ratio),
                          'interested'
                        )}`}
                      >
                        {stat.interested_ratio}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(
                          parseFloat(stat.negative_outcome_ratio),
                          'negative'
                        )}`}
                      >
                        {stat.negative_outcome_ratio}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-700">
                        {stat.wrong_number_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`text-sm font-bold ${
                          stat.followups_missed > 5 ? 'text-red-600' : 'text-gray-600'
                        }`}
                      >
                        {stat.followups_missed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {stat.abuse_flag ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                          <AlertTriangle size={14} />
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-blue-600 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">About Daily Stats</h4>
            <p className="text-sm text-blue-800">
              Daily stats are automatically calculated and saved every day at 7:00 PM IST.
              Telecallers are flagged when they have 80% or more negative outcomes AND 5% or less interested outcomes in a day.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStatsHistory;
