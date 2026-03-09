import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Phone, Search, Filter, AlertCircle, Target, MapPin,
  Clock, Calendar, TrendingUp, CheckCircle,
  RefreshCw, X, Edit2, UserCircle, UserPlus
} from 'lucide-react';
import CallLogModal from '../../components/CallLogModal';
import API_URL from '../../config/api';

const TelecallerLeads = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedLeadId = searchParams.get('highlight');
  const [highlightId, setHighlightId] = useState(null);
  const leadRefs = useRef({});

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add Lead modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', father_name: '', phone: '', neet: '', city: '', remark: '' });
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user, statusFilter]);

  // Handle highlight from notification click
  useEffect(() => {
    if (highlightedLeadId && leads.length > 0) {
      const leadId = parseInt(highlightedLeadId);
      setHighlightId(leadId);

      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        // Open call log modal for the highlighted lead
        setSelectedLead(lead);
        setCallLogModalOpen(true);

        setTimeout(() => {
          if (leadRefs.current[leadId]) {
            leadRefs.current[leadId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }

      setSearchParams({});
      setTimeout(() => setHighlightId(null), 5000);
    }
  }, [highlightedLeadId, leads]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const url = `${API_URL}/leads/assigned/${user.id}${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
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
      alert('Re-open request already pending. Please wait for admin approval.');
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
        alert('Re-open request submitted! Admin will review your request.');
        fetchLeads();
      } else {
        alert('Failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error requesting re-open:', error);
      alert('Error submitting re-open request.');
    }
  };

  // Edit lead handler
  const handleEditLead = (lead) => {
    setEditFormData({ ...lead });
    setEditModalOpen(true);
  };

  const handleUpdateLead = async () => {
    if (!editFormData) return;
    setEditSaving(true);

    try {
      const response = await fetch(`${API_URL}/leads/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          father_name: editFormData.father_name,
          phone: editFormData.phone,
          city: editFormData.city,
          neet: editFormData.neet,
          remark: editFormData.remark,
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Lead updated successfully!');
        setEditModalOpen(false);
        setEditFormData(null);
        fetchLeads();
      } else {
        alert('Failed to update: ' + result.message);
      }
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Error updating lead.');
    } finally {
      setEditSaving(false);
    }
  };


  // Add new lead (auto-assigned to this telecaller)
  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.phone) {
      alert('Student Name and Mobile Number are required');
      return;
    }
    setAddSaving(true);
    try {
      // Create lead
      const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addFormData.name,
          father_name: addFormData.father_name || null,
          phone: addFormData.phone,
          neet: addFormData.neet || null,
          city: addFormData.city || null,
          remark: addFormData.remark || null,
          status: 'Followup',
        })
      });
      const result = await response.json();
      if (!result.success) {
        alert('Failed to add lead: ' + result.message);
        setAddSaving(false);
        return;
      }

      // Auto-assign to this telecaller
      await fetch(`${API_URL}/leads/${result.data.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: user.id, assignedToName: user.name })
      });

      alert('Lead added and assigned to you successfully!');
      setAddModalOpen(false);
      setAddFormData({ name: '', father_name: '', phone: '', neet: '', city: '', remark: '' });
      fetchLeads();
    } catch (err) {
      console.error('Error adding lead:', err);
      alert('Error adding lead.');
    } finally {
      setAddSaving(false);
    }
  };

  // Filtered leads
  const filteredLeads = leads.filter((lead) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !searchTerm ||
      lead.name?.toLowerCase().includes(q) ||
      lead.phone?.includes(searchTerm) ||
      lead.city?.toLowerCase().includes(q) ||
      lead.father_name?.toLowerCase().includes(q);

    const matchCity = cityFilter === 'all' || lead.city === cityFilter;
    const matchSubStatus = subStatusFilter === 'all' || lead.latest_call_reason === subStatusFilter;

    return matchSearch && matchCity && matchSubStatus;
  });

  // Unique cities and sub-statuses for filter dropdowns
  const uniqueCities = [...new Set(leads.map(l => l.city).filter(Boolean))].sort();
  const uniqueSubStatuses = [...new Set(leads.map(l => l.latest_call_reason).filter(Boolean))].sort();

  // Stats
  const stats = {
    total: leads.length,
    followup: leads.filter(l => l.status === 'Follow Up' || l.status === 'Followup').length,
    interested: leads.filter(l => l.status === 'Interested').length,
    callBack: leads.filter(l => l.status === 'Call Back').length,
    overdue: leads.filter(l => l.next_followup_date && new Date(l.next_followup_date) < new Date()).length,
    total_filtered: filteredLeads.length,
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'New': 'bg-blue-100 text-blue-800 border-blue-300',
      'Followup': 'bg-blue-100 text-blue-800 border-blue-300',
      'Follow Up': 'bg-blue-100 text-blue-800 border-blue-300',
      'Interested': 'bg-purple-100 text-purple-800 border-purple-300',
      'Call Back': 'bg-orange-100 text-orange-800 border-orange-300',
      'Office Visit': 'bg-teal-100 text-teal-800 border-teal-300',
      'After Result / Counseling': 'bg-amber-100 text-amber-800 border-amber-300',
      'Other Course': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      'Not Interested': 'bg-gray-100 text-gray-800 border-gray-300',
      'Drop': 'bg-rose-100 text-rose-800 border-rose-300',
      'Invalid Lead': 'bg-red-100 text-red-800 border-red-300',
      'Converted': 'bg-green-100 text-green-800 border-green-300',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const isOverdue = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
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
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Assigned Leads</h1>
          <p className="text-gray-500 text-sm">Manage and follow up with your assigned enquiries</p>
        </div>
        {user?.permissions?.includes('create_lead') && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <UserPlus size={16} />
            Add Lead
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-4">
        {[
          { label: 'Total', value: stats.total, color: 'from-blue-500 to-blue-600', icon: TrendingUp },
          { label: 'Follow Up', value: stats.followup, color: 'from-indigo-500 to-indigo-600', icon: Clock },
          { label: 'Interested', value: stats.interested, color: 'from-purple-500 to-purple-600', icon: CheckCircle },
          { label: 'Call Back', value: stats.callBack, color: 'from-orange-500 to-orange-600', icon: Phone },
          { label: 'Overdue', value: stats.overdue, color: 'from-red-500 to-red-600', icon: AlertCircle },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 text-white shadow-md`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] opacity-90">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon size={20} className="opacity-80" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-3 md:p-4 mb-4 border border-gray-100">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city, father's name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-xs md:text-sm"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-xs font-medium bg-white"
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="Followup">Followup</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Interested">Interested</option>
              <option value="Call Back">Call Back</option>
              <option value="Office Visit">Office Visit</option>
              <option value="After Result / Counseling">After Result</option>
              <option value="Other Course">Other Course</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Drop">Drop</option>
              <option value="Invalid Lead">Invalid Lead</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-600 mb-1">City:</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-xs font-medium bg-white"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Sub Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Sub Status:</label>
            <select
              value={subStatusFilter}
              onChange={(e) => setSubStatusFilter(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg focus:border-purple-500 outline-none text-xs font-medium bg-white"
            >
              <option value="all">All Sub Status</option>
              {uniqueSubStatuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {(searchTerm || statusFilter !== 'all' || cityFilter !== 'all' || subStatusFilter !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCityFilter('all'); setSubStatusFilter('all'); }}
            className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-semibold border border-purple-300 px-3 py-1 rounded-lg hover:bg-purple-50 transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <AlertCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No leads found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || cityFilter !== 'all'
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Student Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Father's Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mobile Number</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">NEET Score</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Sub Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    ref={(el) => leadRefs.current[lead.id] = el}
                    className={`border-b border-gray-100 transition-all duration-200 ${
                      highlightId === lead.id
                        ? 'bg-yellow-100 ring-2 ring-yellow-400 animate-pulse'
                        : 'bg-white hover:bg-purple-50'
                    } ${lead.is_transferred ? 'opacity-60' : ''}`}
                  >
                    {/* Student Name */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {lead.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{lead.name}</div>
                          <div className="text-[10px] text-gray-400">#{1000 + lead.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Father's Name */}
                    <td className="px-3 py-2">
                      <span className="text-[10px] font-medium text-gray-700">{lead.father_name || '-'}</span>
                    </td>

                    {/* Mobile Number */}
                    <td className="px-3 py-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 w-fit hover:bg-blue-100 transition-colors"
                      >
                        <Phone size={11} className="text-blue-600" />
                        <span className="text-[10px] font-semibold text-blue-700">{lead.phone}</span>
                      </a>
                    </td>

                    {/* NEET Score */}
                    <td className="px-3 py-2">
                      {lead.neet ? (
                        <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                          <Target size={11} />
                          {lead.neet}
                        </div>
                      ) : <span className="text-[10px] text-gray-400">-</span>}
                    </td>

                    {/* City */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                        <MapPin size={11} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">{lead.city || '-'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        {getStatusBadge(lead.status)}
                        {lead.is_transferred && (
                          <div className="bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 w-fit">
                            <span className="text-[9px] font-bold text-purple-700">TRANSFERRED</span>
                          </div>
                        )}
                        {lead.next_followup_date && (
                          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border w-fit ${
                            isOverdue(lead.next_followup_date)
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}>
                            <Clock size={9} className={isOverdue(lead.next_followup_date) ? 'text-red-500' : 'text-gray-500'} />
                            <span className={`text-[9px] font-bold ${isOverdue(lead.next_followup_date) ? 'text-red-600' : 'text-gray-600'}`}>
                              {formatDateTime(lead.next_followup_date)}
                              {isOverdue(lead.next_followup_date) && ' ⚠️'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Sub Status */}
                    <td className="px-3 py-2">
                      {lead.latest_call_reason ? (
                        <span className="inline-block bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md text-[10px] font-medium">
                          {lead.latest_call_reason}
                        </span>
                      ) : <span className="text-[10px] text-gray-400">-</span>}
                    </td>

                    {/* Remarks */}
                    <td className="px-3 py-2 max-w-[150px]">
                      <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                        <div className="text-[10px] text-gray-700 truncate font-medium">
                          {lead.latest_call_remark || lead.remark || '-'}
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2">
                      {lead.is_transferred ? (
                        <div className="bg-purple-50 px-2 py-1.5 rounded-md border border-purple-200">
                          <span className="block text-[9px] font-semibold text-purple-500">TRANSFERRED TO</span>
                          <span className="text-xs font-bold text-purple-700">{lead.transferred_to_name || 'Counsellor'}</span>
                        </div>
                      ) : lead.status === 'Not Interested' ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleRequestReopen(lead)}
                            disabled={lead.reopen_requested}
                            className={`${lead.reopen_requested ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'} text-white px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold`}
                          >
                            <RefreshCw size={10} />
                            {lead.reopen_requested ? 'Pending...' : 'Re-open'}
                          </button>
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold transition-all"
                          >
                            <Edit2 size={10} />
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => { setSelectedLead(lead); setCallLogModalOpen(true); }}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold shadow-sm"
                          >
                            <Phone size={10} />
                            Call Log
                          </button>
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold transition-all"
                          >
                            <Edit2 size={10} />
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      )}

      {/* Call Log Modal */}
      <CallLogModal
        isOpen={callLogModalOpen}
        onClose={() => { setCallLogModalOpen(false); setSelectedLead(null); }}
        lead={selectedLead}
        onSuccess={fetchLeads}
      />

      {/* Edit Lead Modal */}
      {editModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Edit Lead Details</h2>
                  <p className="text-indigo-100 text-xs">{editFormData.name}</p>
                </div>
              </div>
              <button onClick={() => { setEditModalOpen(false); setEditFormData(null); }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={editFormData.father_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                    placeholder="Father's full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">NEET Score</label>
                  <input
                    type="text"
                    value={editFormData.neet || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, neet: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                    placeholder="e.g. 520"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none"
                    placeholder="City name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remark</label>
                <textarea
                  value={editFormData.remark || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none resize-none"
                  placeholder="Add remarks..."
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> To change status or add call outcome, use the <strong>Call Log</strong> button.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => { setEditModalOpen(false); setEditFormData(null); }}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLead}
                disabled={editSaving}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm disabled:opacity-50"
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add Lead Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Add New Lead</h2>
                  <p className="text-purple-100 text-xs">Will be auto-assigned to you</p>
                </div>
              </div>
              <button onClick={() => { setAddModalOpen(false); setAddFormData({ name: '', father_name: '', phone: '', neet: '', city: '', remark: '' }); }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAddLead} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name *</label>
                  <input
                    type="text"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={addFormData.father_name}
                    onChange={(e) => setAddFormData({ ...addFormData, father_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    placeholder="Father's full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    placeholder="10-digit number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">NEET Score</label>
                  <input
                    type="text"
                    value={addFormData.neet}
                    onChange={(e) => setAddFormData({ ...addFormData, neet: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    placeholder="e.g. 520"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    placeholder="City name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Remark</label>
                <textarea
                  value={addFormData.remark}
                  onChange={(e) => setAddFormData({ ...addFormData, remark: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none resize-none"
                  placeholder="Add remarks..."
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); setAddFormData({ name: '', father_name: '', phone: '', neet: '', city: '', remark: '' }); }}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-sm transition-all shadow-sm disabled:opacity-50"
                >
                  {addSaving ? 'Adding...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelecallerLeads;
