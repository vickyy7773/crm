import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, Search, RefreshCw, User, Phone, MapPin, Calendar,
  TrendingUp, Award, MessageSquare, Edit, AlertTriangle
} from 'lucide-react';
import CallLogModal from '../components/CallLogModal';

import API_URL from '../config/api';

const ConvertedLeads = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [editingStatusId, setEditingStatusId] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchConvertedLeads();
  }, []);

  const fetchConvertedLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/leads/converted`);
      const data = await response.json();

      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching converted leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCallLog = (lead) => {
    setSelectedLead(lead);
    setCallLogModalOpen(true);
  };

  const handleCallLogSuccess = () => {
    fetchConvertedLeads();
  };

  const handleStatusChange = async (leadId) => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    if (!confirm(`Are you sure you want to change the status from "Converted" to "${newStatus}"? This will move the lead back to active leads.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/leads/${leadId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updatedBy: user.name
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Status updated successfully! Lead moved back to active leads.');
        setEditingStatusId(null);
        setNewStatus('');
        fetchConvertedLeads();
      } else {
        alert('Failed to update status: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.assigned_to_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const truncateText = (text, maxLength = 40) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading converted leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-lg border-2 border-white/30">
              <Award size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Converted Leads</h1>
              <p className="text-green-100 text-lg">Successfully converted students - {filteredLeads.length} total</p>
            </div>
          </div>
          <button
            onClick={fetchConvertedLeads}
            className="flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold transition-all backdrop-blur-lg border-2 border-white/30"
          >
            <RefreshCw size={20} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Converted</p>
              <p className="text-4xl font-bold mt-1">{filteredLeads.length}</p>
            </div>
            <CheckCircle size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">This Month</p>
              <p className="text-4xl font-bold mt-1">
                {filteredLeads.filter(l => {
                  const updatedDate = new Date(l.updated_at);
                  const now = new Date();
                  return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <TrendingUp size={40} className="opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Top Performer</p>
              <p className="text-lg font-bold mt-1">
                {leads.length > 0
                  ? Object.entries(
                      leads.reduce((acc, lead) => {
                        const name = lead.assigned_to_name || 'Unassigned';
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
                  : '-'}
              </p>
            </div>
            <Award size={40} className="opacity-80" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, city, or telecaller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Admin Note */}
      {user.role === 'Super Admin' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <p className="text-blue-900 font-semibold">Admin Privilege</p>
            <p className="text-blue-700 text-sm">
              As a Super Admin, you can change the status of converted leads. Click the edit icon to revert a lead to active status.
            </p>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-16">
            <Award className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg font-semibold">No converted leads yet</p>
            <p className="text-gray-400 text-sm mt-2">Converted leads will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Remark
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Converted Date
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-green-900 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-green-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-green-600" />
                        <span className="font-semibold text-gray-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline">
                        <Phone size={14} />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin size={14} className="text-gray-400" />
                        {lead.city || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {lead.destination || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                          {lead.assigned_to_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {lead.assigned_to_name || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="text-sm text-gray-600">
                        {truncateText(lead.remark)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {formatDate(lead.updated_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingStatusId === lead.id && user.role === 'Super Admin' ? (
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="text-sm px-3 py-1 border-2 border-orange-300 rounded-lg focus:border-orange-500 outline-none"
                        >
                          <option value="">Select Status</option>
                          <option value="Interested">Interested</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Call Back">Call Back</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold inline-flex items-center gap-1">
                          <CheckCircle size={12} />
                          Converted
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {editingStatusId === lead.id && user.role === 'Super Admin' ? (
                          <>
                            <button
                              onClick={() => handleStatusChange(lead.id)}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingStatusId(null);
                                setNewStatus('');
                              }}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAddCallLog(lead)}
                              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-1"
                            >
                              <MessageSquare size={12} />
                              Call Log
                            </button>
                            {user.role === 'Super Admin' && (
                              <button
                                onClick={() => {
                                  setEditingStatusId(lead.id);
                                  setNewStatus('');
                                }}
                                className="p-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-all"
                                title="Change Status (Admin Only)"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Log Modal */}
      <CallLogModal
        isOpen={callLogModalOpen}
        onClose={() => {
          setCallLogModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        onSuccess={handleCallLogSuccess}
      />
    </div>
  );
};

export default ConvertedLeads;
