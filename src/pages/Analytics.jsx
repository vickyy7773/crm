import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { TrendingUp, Users, Phone, Award, Calendar } from 'lucide-react';
import API_URL from '../config/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = dateRange !== 'all' ? `?days=${dateRange}` : '';

      const [perfRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/analytics/telecaller-performance${params}`),
        fetch(`${API_URL}/analytics/summary`)
      ]);

      const perfData = await perfRes.json();
      const summaryData = await summaryRes.json();

      if (perfData.success) {
        setPerformanceData(perfData.data);
      }
      if (summaryData.success) {
        setSummary(summaryData.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for Total Calls
  const callsChartData = {
    labels: performanceData.map(t => t.telecaller_name),
    datasets: [{
      label: 'Total Calls',
      data: performanceData.map(t => t.total_calls),
      backgroundColor: 'rgba(147, 51, 234, 0.7)',
      borderColor: 'rgba(147, 51, 234, 1)',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  // Chart data for Conversions
  const conversionsChartData = {
    labels: performanceData.map(t => t.telecaller_name),
    datasets: [{
      label: 'Conversions',
      data: performanceData.map(t => t.conversions),
      backgroundColor: 'rgba(236, 72, 153, 0.7)',
      borderColor: 'rgba(236, 72, 153, 1)',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  // Chart data for Success Rate
  const successRateChartData = {
    labels: performanceData.map(t => t.telecaller_name),
    datasets: [{
      label: 'Success Rate (%)',
      data: performanceData.map(t => t.success_rate),
      backgroundColor: 'rgba(34, 197, 94, 0.7)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Telecaller Performance Metrics</p>
        </div>
        <div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none"
          >
            <option value="all">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Phone size={28} />
              <TrendingUp size={20} className="opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{summary.totalCalls}</h3>
            <p className="text-purple-100 text-sm">Total Calls</p>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Award size={28} />
              <TrendingUp size={20} className="opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{summary.totalConversions}</h3>
            <p className="text-pink-100 text-sm">Total Conversions</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users size={28} />
            </div>
            <h3 className="text-3xl font-bold mb-1">{summary.totalTelecallers}</h3>
            <p className="text-green-100 text-sm">Active Telecallers</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Calendar size={28} />
            </div>
            <h3 className="text-3xl font-bold mb-1">{summary.todayCalls}</h3>
            <p className="text-blue-100 text-sm">Today's Calls</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={28} />
            </div>
            <h3 className="text-3xl font-bold mb-1">{summary.overallSuccessRate}%</h3>
            <p className="text-orange-100 text-sm">Success Rate</p>
          </div>
        </div>
      )}

      {/* Top Performer */}
      {summary?.topPerformer && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Award size={32} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Top Performer This Month</h3>
              <p className="text-purple-600 text-lg font-semibold mt-1">
                {summary.topPerformer.name} - {summary.topPerformer.conversions} Conversions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Calls Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Total Calls by Telecaller</h3>
          <div className="h-80">
            <Bar data={callsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Conversions Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Conversions by Telecaller</h3>
          <div className="h-80">
            <Bar data={conversionsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Success Rate Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Success Rate Comparison (%)</h3>
          <div className="h-80">
            <Bar data={successRateChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Detailed Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Telecaller</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Total Calls</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Conversions</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Success Rate</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Contacted</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Interested</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Call Back</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {performanceData.map((tel, index) => (
                <tr key={index} className="hover:bg-purple-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">{tel.telecaller_name}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{tel.total_calls}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full font-semibold">
                      {tel.conversions}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                      {tel.success_rate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-700">{tel.outcomes?.Contacted || 0}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{tel.outcomes?.Interested || 0}</td>
                  <td className="px-6 py-4 text-center text-gray-700">{tel.outcomes?.['Call Back'] || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
