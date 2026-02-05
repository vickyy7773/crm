import { useState, useEffect } from 'react';
import {
  Activity as ActivityIcon,
  Phone,
  Mail,
  Calendar,
  FileText,
  UserPlus,
  CheckCircle,
  Clock,
  Filter,
  Search,
  X,
  TrendingUp
} from 'lucide-react';

import API_URL from '../config/api';

const Activity = () => {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [personActivities, setPersonActivities] = useState([]);
  const [stats, setStats] = useState({ teamMembers: 0, totalActivities: 0 });

  // Fetch activities on component mount
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, []);

  // Fetch activities with search and filter
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/activities?search=${searchTerm}&type=${filter}&limit=100`);
      const data = await response.json();

      if (data.success) {
        setActivities(data.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch activity statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/activities/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch person-specific activities when modal opens
  const fetchPersonActivities = async (personName) => {
    try {
      const response = await fetch(`${API_URL}/activities/person/${encodeURIComponent(personName)}`);
      const data = await response.json();

      if (data.success) {
        setPersonActivities(data.data);
      }
    } catch (error) {
      console.error('Error fetching person activities:', error);
      setPersonActivities([]);
    }
  };

  // Handle person selection
  const handlePersonSelect = (personName) => {
    setSelectedPerson(personName);
    fetchPersonActivities(personName);
  };

  // Re-fetch when search or filter changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchActivities();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, filter]);

  // Since filtering is done on backend, we can use activities directly
  // But we'll filter by type on frontend for now (since we only have calls in DB)
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'call') return activity.type === 'call';
    // For other types (email, meeting), filter them out since we don't have that data yet
    return false;
  });

  // Get unique persons count
  const uniquePersons = [...new Set(activities.map(a => a.person))];
  const totalActivities = stats.totalActivities || activities.length;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone size={18} className="text-blue-600" />;
      case 'email':
        return <Mail size={18} className="text-purple-600" />;
      case 'meeting':
        return <Calendar size={18} className="text-green-600" />;
      case 'add':
        return <UserPlus size={18} className="text-orange-600" />;
      case 'update':
        return <FileText size={18} className="text-pink-600" />;
      default:
        return <ActivityIcon size={18} className="text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100';
      case 'email':
        return 'bg-purple-100';
      case 'meeting':
        return 'bg-green-100';
      case 'add':
        return 'bg-orange-100';
      case 'update':
        return 'bg-pink-100';
      default:
        return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ActivityIcon size={32} className="text-purple-600" />
              Activity Log
            </h1>
            <p className="text-gray-600 mt-2">Track all team activities and interactions</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-purple-600">{uniquePersons.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-blue-600">{totalActivities}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by person or lead name..."
              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('call')}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                filter === 'call' ? 'bg-blue-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Calls
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                filter === 'email' ? 'bg-purple-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Emails
            </button>
            <button
              onClick={() => setFilter('meeting')}
              className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                filter === 'meeting' ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Meetings
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
          <p className="text-sm text-gray-600 mt-1">Click on a person to see their detailed daily activities</p>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <ActivityIcon size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No activities found</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div
                    onClick={() => handlePersonSelect(activity.person)}
                    className={`w-12 h-12 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-110 transition-transform`}
                  >
                    <span className="font-bold text-gray-700">{activity.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-gray-900">
                          <button
                            onClick={() => handlePersonSelect(activity.person)}
                            className="font-bold hover:text-purple-600 transition-colors underline decoration-dotted"
                          >
                            {activity.person}
                          </button>
                          {' '}
                          <span className="text-gray-600">{activity.action}</span>
                          {' '}
                          <span className="font-semibold text-gray-900">{activity.leadName}</span>
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock size={14} />
                            {activity.time}
                          </span>
                          <span className="text-sm text-gray-500">{activity.timestamp}</span>
                        </div>
                      </div>
                      <div className={`p-2 rounded-lg ${getActivityColor(activity.type)} flex-shrink-0`}>
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Person Detail Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedPerson}</h2>
                  <p className="text-purple-100 mt-1">Today's Activity Summary</p>
                </div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {personActivities.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Tasks</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {personActivities.filter(a => a.result && a.result.includes('Interested')).length || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Hot Leads</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">100%</p>
                  <p className="text-sm text-gray-600 mt-1">Completion</p>
                </div>
              </div>

              {/* Activities Timeline */}
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-600" />
                Activity Timeline
              </h3>
              <div className="space-y-4">
                {personActivities.length > 0 ? personActivities.map((activity, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-20 text-sm font-semibold text-purple-600">
                      {activity.time}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{activity.action}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {activity.duration !== '-' && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {activity.duration}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-600" />
                          {activity.result}
                        </span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <ActivityIcon size={48} className="mx-auto text-gray-300 mb-2" />
                    <p>No activities found for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;
