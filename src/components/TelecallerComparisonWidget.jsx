import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Users, Phone } from 'lucide-react';
import API_URL from '../config/api';

const TelecallerComparisonWidget = () => {
  const [telecallers, setTelecallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalTelecallers: 0, flaggedTelecallers: 0 });

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/users/telecallers/comparison`);
      const result = await response.json();

      if (result.success) {
        setTelecallers(result.data);
        setSummary(result.summary);
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
    } finally {
      setLoading(false);
    }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Telecaller Performance Comparison</h2>
            <p className="text-purple-100 text-sm">Last 30 calls pattern analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-2">
                <Users size={20} />
                <span className="text-3xl font-bold">{summary.totalTelecallers}</span>
              </div>
              <p className="text-xs text-purple-100">Total</p>
            </div>
            {summary.flaggedTelecallers > 0 && (
              <div className="text-center bg-red-500/20 backdrop-blur px-4 py-2 rounded-lg border border-red-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-yellow-300" />
                  <span className="text-3xl font-bold text-yellow-300">{summary.flaggedTelecallers}</span>
                </div>
                <p className="text-xs text-yellow-100">⚠️ Flagged</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Telecaller
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Phone size={14} className="inline mr-1" />
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
                Wrong Number %
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Missed Follow-ups
              </th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {telecallers.map((telecaller, index) => (
              <tr
                key={telecaller.id}
                className={`hover:bg-gray-50 transition-colors ${
                  telecaller.abuseFlag ? 'bg-red-50 border-l-4 border-red-500' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {telecaller.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-semibold text-gray-900">{telecaller.name}</p>
                      <p className="text-xs text-gray-500">{telecaller.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-bold text-gray-900">{telecaller.totalCalls}</div>
                  <div className="text-xs text-gray-500">({telecaller.recentCallsAnalyzed} recent)</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(telecaller.interestedPercentage, 'interested')}`}>
                    {telecaller.interestedPercentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getPerformanceColor(telecaller.negativePercentage, 'negative')}`}>
                    {telecaller.negativePercentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-semibold text-gray-700">
                    {telecaller.wrongNumberPercentage}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`text-sm font-bold ${telecaller.followupsMissed > 5 ? 'text-red-600' : 'text-gray-600'}`}>
                    {telecaller.followupsMissed}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {telecaller.abuseFlag ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                      <AlertTriangle size={14} />
                      ⚠️ Flagged
                    </span>
                  ) : telecaller.recentCallsAnalyzed < 10 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                      Insufficient Data
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      ✓ Normal
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {telecallers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500">No telecaller data available</p>
        </div>
      )}

      {/* Footer Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-gray-600">Abuse Flag: ≥80% negative & ≤5% interested (last 30 calls)</span>
            </div>
          </div>
          <button
            onClick={fetchComparisonData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelecallerComparisonWidget;
