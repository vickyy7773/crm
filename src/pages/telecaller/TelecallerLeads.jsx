import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Phone, Search, Filter, AlertCircle, User, Target, MapPin,
  GraduationCap, Globe, Clock, Calendar, TrendingUp, CheckCircle,
  XCircle, RefreshCw, MessageSquare
} from 'lucide-react';
import CallLogModal from '../../components/CallLogModal';
import API_URL from '../../config/api';

const TelecallerLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/leads/assigned/${user.id}${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Filter out converted leads - they should only appear in Converted Leads page
        const nonConvertedLeads = data.data.filter(lead => lead.status !== 'Converted');
        setLeads(nonConvertedLeads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReopen = async (lead) => {
    if (lead.reopen_requested) {
      alert('Re-open request already pending for this lead. Please wait for admin approval.');
      return;
    }

    const reason = prompt('Please provide a reason for re-opening this lead:');
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/leads/${lead.id}/request-reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: user.id,
          requesterName: user.name,
          reason: reason.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Re-open request submitted successfully! Admin will review your request.');
        fetchLeads();
      } else {
        alert('Failed to submit re-open request: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error requesting re-open:', error);
      alert('Error submitting re-open request. Please try again.');
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: filteredLeads.length,
    new: filteredLeads.filter(l => l.status === 'New').length,
    contacted: filteredLeads.filter(l => l.status === 'Contacted').length,
    interested: filteredLeads.filter(l => l.status === 'Interested').length,
    converted: filteredLeads.filter(l => l.status === 'Converted').length,
    overdue: filteredLeads.filter(l => l.next_followup_date && new Date(l.next_followup_date) < new Date()).length,
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'New': 'bg-blue-100 text-blue-800 border-blue-300',
      'Contacted': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Interested': 'bg-purple-100 text-purple-800 border-purple-300',
      'Converted': 'bg-green-100 text-green-800 border-green-300',
      'Not Interested': 'bg-gray-100 text-gray-800 border-gray-300',
      'Call Back': 'bg-orange-100 text-orange-800 border-orange-300',
      'Wrong Number': 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold text-lg">Loading your leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          My Assigned Leads
        </h1>
        <p className="text-gray-600">Manage and follow up with your leads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Total</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
            </div>
            <TrendingUp size={24} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">New</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.new}</p>
            </div>
            <Target size={24} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Contacted</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.contacted}</p>
            </div>
            <Phone size={24} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Interested</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.interested}</p>
            </div>
            <CheckCircle size={24} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Converted</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.converted}</p>
            </div>
            <TrendingUp size={24} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Overdue</p>
              <p className="text-2xl md:text-3xl font-bold">{stats.overdue}</p>
            </div>
            <Clock size={24} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter className="text-gray-400" size={20} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none appearance-none cursor-pointer transition-all text-sm font-medium"
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Call Back">Call Back</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Wrong Number">Wrong Number</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <AlertCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No leads found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'You have no assigned leads yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Destination</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Last Call</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Next Follow-up</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`bg-white border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 transition-all duration-200 hover:shadow-sm ${
                      !!lead.is_transferred ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Name */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{lead.name}</div>
                          <div className="text-[10px] text-gray-500">ID: #{1000 + lead.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2.5">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 w-fit hover:bg-blue-100 transition-colors"
                      >
                        <Phone size={11} className="text-blue-600" />
                        <span className="text-[10px] font-semibold text-blue-700 truncate max-w-[100px]">{lead.phone}</span>
                      </a>
                    </td>

                    {/* City */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                        <MapPin size={11} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">{lead.city || '-'}</span>
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200 w-fit">
                        <Globe size={11} className="text-indigo-600" />
                        <span className="font-bold text-indigo-700 text-xs">{lead.destination || '-'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <div className="space-y-1">
                        {getStatusBadge(lead.status)}
                        {!!lead.is_transferred && (
                          <div className="flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 w-fit">
                            <span className="text-[9px] font-bold text-purple-700">TRANSFERRED</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Last Call */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-200 w-fit">
                        <Calendar size={10} className="text-gray-600" />
                        <span className="text-[10px] font-semibold text-gray-700">{formatDate(lead.last_call_date)}</span>
                      </div>
                    </td>

                    {/* Next Follow-up */}
                    <td className="px-3 py-2.5">
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border w-fit ${
                        isOverdue(lead.next_followup_date) && lead.next_followup_date
                          ? 'bg-red-50 border-red-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <Clock size={10} className={isOverdue(lead.next_followup_date) && lead.next_followup_date ? 'text-red-600' : 'text-gray-600'} />
                        <span className={`text-[10px] font-bold ${
                          isOverdue(lead.next_followup_date) && lead.next_followup_date ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          {formatDateTime(lead.next_followup_date)}
                        </span>
                        {isOverdue(lead.next_followup_date) && lead.next_followup_date && (
                          <span className="text-[8px] font-bold text-red-600 ml-1">⚠️</span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2.5">
                      {!!lead.is_transferred ? (
                        <div className="bg-purple-50 px-2 py-1.5 rounded-md border border-purple-200">
                          <span className="block text-[9px] font-semibold text-purple-500">TRANSFERRED TO</span>
                          <span className="text-xs font-bold text-purple-700">
                            {lead.transferred_to_name || 'Counsellor'}
                          </span>
                        </div>
                      ) : lead.status === 'Not Interested' ? (
                        <button
                          className={`${
                            lead.reopen_requested
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                          } text-white px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm`}
                          onClick={() => handleRequestReopen(lead)}
                          disabled={lead.reopen_requested}
                        >
                          <RefreshCw size={12} />
                          {lead.reopen_requested ? 'Pending...' : 'Re-open'}
                        </button>
                      ) : (
                        <button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:shadow"
                          onClick={() => {
                            setSelectedLead(lead);
                            setCallLogModalOpen(true);
                          }}
                        >
                          <Phone size={12} />
                          Add Call Log
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Call Log Modal */}
      <CallLogModal
        isOpen={callLogModalOpen}
        onClose={() => {
          setCallLogModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSuccess={fetchLeads}
      />
    </div>
  );
};

export default TelecallerLeads;
