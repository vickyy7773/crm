import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, Filter } from 'lucide-react';
import API_URL from '../config/api';

const DailyStatsHistoryWidget = () => {
  const [statsHistory, setStatsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(7);
  const [summary, setSummary] = useState({ totalRecords: 0, flaggedRecords: 0 });

  useEffect(() => {
    fetchStatsHistory();
  }, [daysFilter]);

  const fetchStatsHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/users/daily-stats/history?days=${daysFilter}`
      );
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

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Daily Performance History</h2>
            <p className="text-indigo-100 text-sm">Historical telecaller performance snapshots</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Days Filter */}
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
              <Filter size={16} />
              <select
                value={daysFilter}
                onChange={(e) => setDaysFilter(Number(e.target.value))}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer"
              >
                <option value={7} className="text-gray-900">Last 7 Days</option>
                <option value={15} className="text-gray-900">Last 15 Days</option>
                <option value={30} className="text-gray-900">Last 30 Days</option>
                <option value={60} className="text-gray-900">Last 60 Days</option>
              </select>
            </div>
            {summary.flaggedRecords > 0 && (
              <div className="text-center bg-red-500/20 backdrop-blur px-4 py-2 rounded-lg border border-red-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-yellow-300" />
                  <span className="text-2xl font-bold text-yellow-300">{summary.flaggedRecords}</span>
                </div>
                <p className="text-xs text-yellow-100">Flagged Days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Table */}
      {statsHistory.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No historical data available for the selected period</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Telecaller
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Calls
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <TrendingUp size={14} className="inline mr-1" />
                  Interested %
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <TrendingDown size={14} className="inline mr-1" />
                  Negative %
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Wrong Number
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Missed Followups
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
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
                    <div className="text-sm font-semibold text-gray-900">
                      {formatDate(stat.date)}
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

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-gray-600">
                Flagged: 80%+ negative & 5% interested (daily snapshot)
              </span>
            </div>
          </div>
          <button
            onClick={fetchStatsHistory}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-semibold"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyStatsHistoryWidget;
