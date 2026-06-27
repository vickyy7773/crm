import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, Search, RefreshCw, User, Phone, MapPin, Calendar,
  TrendingUp, Award, MessageSquare, Edit, AlertTriangle, Target
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl md:rounded-2xl p-3 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="w-10 h-10 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-lg border-2 border-white/30">
              <Award size={20} className="md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-4xl font-bold mb-1 md:mb-2">Converted Leads</h1>
              <p className="text-green-100 text-xs md:text-lg">{filteredLeads.length} converted students</p>
            </div>
          </div>
          <button
            onClick={fetchConvertedLeads}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-6 py-2 md:py-3 text-sm md:text-base bg-white/20 hover:bg-white/30 rounded-lg md:rounded-xl font-bold transition-all backdrop-blur-lg border-2 border-white/30"
          >
            <RefreshCw size={16} className="md:w-5 md:h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Total Converted</p>
              <p className="text-2xl md:text-4xl font-bold mt-1">{filteredLeads.length}</p>
            </div>
            <CheckCircle size={24} className="opacity-80 hidden md:block md:w-10 md:h-10" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">This Month</p>
              <p className="text-2xl md:text-4xl font-bold mt-1">
                {filteredLeads.filter(l => {
                  const updatedDate = new Date(l.updated_at);
                  const now = new Date();
                  return updatedDate.getMonth() === now.getMonth() && updatedDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <TrendingUp size={24} className="opacity-80 hidden md:block md:w-10 md:h-10" />
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl md:rounded-2xl p-3 md:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm opacity-90">Top Performer</p>
              <p className="text-sm md:text-lg font-bold mt-1">
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
            <Award size={24} className="opacity-80 hidden md:block md:w-10 md:h-10" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-md p-3 md:p-4">
        <div className="relative">
          <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search name, phone, city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 md:pl-12 pr-4 py-2 md:py-3 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Admin Note */}
      {user.role === 'Super Admin' && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg md:rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-blue-900 font-semibold text-sm md:text-base">Admin Privilege</p>
            <p className="text-blue-700 text-xs md:text-sm">
              Click edit icon to revert a lead to active status.
            </p>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-md overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <Award className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 text-base md:text-lg font-semibold">No converted leads yet</p>
            <p className="text-gray-400 text-xs md:text-sm mt-2">Converted leads will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Student Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Father's Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mobile Number</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">NEET Score</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Assigned To</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 hover:bg-green-50 transition-colors bg-white">
                    {/* Student Name */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {lead.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{lead.name}</div>
                          <div className="text-[10px] text-gray-400">#{1000 + lead.id}</div>
                        </div>
                      </div>
                    </td>
                    {/* Father's Name */}
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-medium text-gray-700">{lead.father_name || '-'}</span>
                    </td>
                    {/* Mobile Number */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 w-fit">
                        <Phone size={11} className="text-blue-600" />
                        <a href={`tel:${lead.phone}`} className="text-[10px] font-semibold text-blue-700 hover:underline">{lead.phone}</a>
                      </div>
                    </td>
                    {/* NEET Score */}
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                        <Target size={11} />
                        {lead.neet || '-'}
                      </div>
                    </td>
                    {/* City */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                        <MapPin size={11} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">{lead.city || '-'}</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5">
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
                    {/* Assigned To */}
                    <td className="px-3 py-2.5">
                      {lead.assigned_to_name ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] text-gray-400 font-semibold uppercase">Assigned To</span>
                          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                            {lead.assigned_to_name}
                          </span>
                        </div>
                      ) : <span className="text-[10px] text-gray-400">-</span>}
                    </td>
                    {/* Remarks */}
                    <td className="px-3 py-2.5 max-w-[150px]">
                      <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                        <div className="text-[10px] text-gray-700 truncate font-medium">
                          {lead.latest_call_remark || lead.remark || '-'}
                        </div>
                      </div>
                    </td>
                    {/* Action */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
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
