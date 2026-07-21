import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Phone, Search, Filter, AlertCircle, Target, MapPin,
  Clock, Calendar, TrendingUp, CheckCircle,
  RefreshCw, X, Edit2, UserCircle, UserPlus, MessageSquare, User, Trash2
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
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [remarkModal, setRemarkModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [callLogData, setCallLogData] = useState({ callOutcome: '', callRemark: '', nextFollowUpDate: '' });

  // Add Lead modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLeadType, setNewLeadType] = useState('raw');
  const [addFormData, setAddFormData] = useState({ name: '', fatherName: '', phone: '', city: '', source: '', status: 'Followup', neetPrevious: '', neet2026: '', score: '', course: '', destination: '', nextFollowUpDate: '', remark: '' });
  const [addSaving, setAddSaving] = useState(false);

  // Bulk delete state
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bdSearchTerm, setBdSearchTerm] = useState('');
  const [bdStatusFilter, setBdStatusFilter] = useState('all');
  const [bdCityFilter, setBdCityFilter] = useState('all');
  const [bdSelectedIds, setBdSelectedIds] = useState([]);
  const [bdDeleting, setBdDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user, statusFilter]);

  // Background refresh every 4 min — keeps data live while user is on a call
  // Modal open check uses ref so interval always has latest value
  const editModalOpenRef = useRef(false);
  useEffect(() => { editModalOpenRef.current = editModalOpen; }, [editModalOpen]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      // Always refresh leads list silently; modal form data is separate state so it's safe
      fetchLeads();
    }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, statusFilter]);

  // Also re-fetch on tab focus (coming back after switching apps)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchLeads();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  const openRemarkModal = async (lead) => {
    setSelectedRemark({
      remark: lead.latest_call_remark || lead.remark || 'No remark available',
      leadName: lead.name,
      leadId: lead.id,
      nextFollowUp: lead.next_followup_date,
      callDate: lead.latest_call_date,
      phone: lead.phone,
      status: lead.status,
      city: lead.city,
      course: lead.course,
      score: lead.course?.toLowerCase() === 'other' ? lead.other_score : lead.neet,
    });
    setRemarkModal(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/leads/${lead.id}/call-history`);
      const data = await res.json();
      setCallHistory(data.success ? data.data : []);
    } catch {
      setCallHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeRemarkModal = () => {
    setRemarkModal(false);
    setSelectedRemark(null);
    setCallHistory([]);
  };

  // Edit lead handler
  const handleEditLead = (lead) => {
    setEditFormData({ ...lead });
    setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '' });
    setEditModalOpen(true);
  };

  // Retry a fetch up to `retries` times with 2s delay between attempts
  const fetchWithRetry = async (url, options, retries = 2) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, options);
        return res;
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  };

  const handleUpdateLead = async () => {
    if (!editFormData) return;

    const callLogTouched = callLogData.callOutcome || callLogData.callRemark || callLogData.nextFollowUpDate;
    if (callLogTouched) {
      if (!callLogData.callOutcome) {
        alert('Please select a Call Outcome before saving.');
        return;
      }
      if (['Call Back', 'Follow Up'].includes(callLogData.callOutcome) && !callLogData.nextFollowUpDate) {
        alert(`Please select a Follow-up Date for "${callLogData.callOutcome}".`);
        return;
      }
      if (!callLogData.callRemark.trim()) {
        alert('Please enter a Remark before saving.');
        return;
      }
    }

    setEditSaving(true);

    try {
      const response = await fetchWithRetry(`${API_URL}/leads/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          father_name: editFormData.father_name || '',
          father_phone: editFormData.father_phone || '',
          phone: editFormData.phone,
          city: editFormData.city,
          neet: editFormData.neet,
          course: editFormData.course,
          destination: editFormData.destination || '',
          email: editFormData.email || '',
          remark: editFormData.remark,
        })
      });

      const result = await response.json();
      if (result.success) {
        if (callLogData.callOutcome && callLogData.callRemark.trim()) {
          const logRes = await fetchWithRetry(`${API_URL}/leads/${editFormData.id}/call-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callRemark: callLogData.callRemark,
              callOutcome: callLogData.callOutcome,
              nextFollowUpDate: callLogData.nextFollowUpDate || null,
              callerId: user.id,
              callerName: user.name || user.username || 'Telecaller',
            })
          });
          const logResult = await logRes.json();
          if (!logResult.success) {
            alert('Lead details saved, but call log failed: ' + (logResult.message || 'Unknown error'));
            setEditModalOpen(false);
            setEditFormData(null);
            setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '' });
            fetchLeads();
            return;
          }
        }
        alert('Saved successfully!');
        setEditModalOpen(false);
        setEditFormData(null);
        setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '' });
        fetchLeads();
      } else {
        alert('Failed to update: ' + result.message);
      }
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Network error — please check your connection and try again.');
    } finally {
      setEditSaving(false);
    }
  };


  const resetAddForm = () => {
    setNewLeadType('raw');
    setAddFormData({ name: '', fatherName: '', phone: '', city: '', source: '', status: 'Followup', neetPrevious: '', neet2026: '', score: '', course: '', destination: '', nextFollowUpDate: '', remark: '' });
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
      const leadData = {
        name: addFormData.name,
        father_name: addFormData.fatherName || null,
        phone: addFormData.phone,
        city: addFormData.city || null,
        source: addFormData.source || null,
        status: newLeadType === 'qualified' ? (addFormData.status || 'Followup') : 'Followup',
        neet: (addFormData.course === 'MBBS' || addFormData.course === 'BAMS/BDS')
          ? ([addFormData.neetPrevious, addFormData.neet2026].filter(Boolean).join(' | 2026: ') || null)
          : null,
        other_score: addFormData.course === 'Other' ? (addFormData.score || null) : null,
        course: newLeadType === 'qualified' ? (addFormData.course || null) : null,
        destination: newLeadType === 'qualified' ? (addFormData.destination || null) : null,
        remark: addFormData.remark || null,
      };

      const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
      const result = await response.json();

      if (!result.success) {
        alert('Failed to add lead: ' + result.message);
        setAddSaving(false);
        return;
      }

      // Set follow-up date if provided
      if (addFormData.nextFollowUpDate) {
        await fetch(`${API_URL}/leads/${result.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ next_followup_date: addFormData.nextFollowUpDate })
        });
      }

      // Auto-assign to this telecaller
      await fetch(`${API_URL}/leads/${result.data.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: user.id, assignedToName: user.name })
      });

      alert('Lead added and assigned to you successfully!');
      setAddModalOpen(false);
      resetAddForm();
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

    return matchSearch && matchCity;
  });

  // Unique cities and sub-statuses for filter dropdowns
  const uniqueCities = [...new Set(leads.map(l => l.city).filter(Boolean))].sort();
  const bdUniqueStatuses = [...new Set(leads.map(l => l.status).filter(Boolean))].sort();

  const bdFilteredLeads = leads.filter(lead => {
    if (bdStatusFilter !== 'all' && lead.status !== bdStatusFilter) return false;
    if (bdCityFilter !== 'all' && lead.city !== bdCityFilter) return false;
    if (bdSearchTerm.trim()) {
      const q = bdSearchTerm.toLowerCase();
      return lead.name?.toLowerCase().includes(q) || lead.phone?.includes(q) || lead.city?.toLowerCase().includes(q);
    }
    return true;
  });

  const resetBdFilters = () => {
    setBdStatusFilter('all'); setBdCityFilter('all');
    setBdSearchTerm(''); setBdSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (bdSelectedIds.length === 0) { alert('Please select at least one lead to delete'); return; }
    if (!confirm(`Permanently delete ${bdSelectedIds.length} lead(s)? This cannot be undone!`)) return;
    try {
      setBdDeleting(true);
      let successCount = 0;
      for (const id of bdSelectedIds) {
        const res = await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) successCount++;
      }
      alert(`${successCount} lead(s) deleted successfully!`);
      setBulkDeleteModalOpen(false);
      resetBdFilters();
      fetchLeads();
    } catch (err) {
      alert('Failed to delete leads. Please try again.');
    } finally {
      setBdDeleting(false);
    }
  };

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
      'Office Visit': 'bg-teal-100 text-teal-800 border-teal-300',
      'Counseling Done': 'bg-emerald-100 text-emerald-800 border-emerald-300',
      'After Result / Counseling': 'bg-amber-100 text-amber-800 border-amber-300',
      'India': 'bg-orange-100 text-orange-800 border-orange-300',
      'Call Back': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Other Course': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      'Drop': 'bg-rose-100 text-rose-800 border-rose-300',
      'Not Interested': 'bg-gray-100 text-gray-800 border-gray-300',
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
          <p className="text-gray-500 text-sm">{user?.role} — Manage and follow up with your assigned enquiries</p>
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
              <option value="Interested">Interested</option>
              <option value="Office Visit">Office Visit</option>
              <option value="Counseling Done">Counseling Done</option>
              <option value="Follow Up">Follow Up</option>
              <option value="After Result / Counseling">After Result / Counseling</option>
              <option value="India">India</option>
              <option value="Call Back">Call Back</option>
              <option value="Other Course">Other Course</option>
              <option value="Drop">Drop</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Invalid Lead">Invalid Lead</option>
              <option value="Converted">Converted</option>
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

        </div>

        {/* Bottom row: clear filters + bulk delete */}
        <div className="flex items-center justify-between mt-2">
          {(searchTerm || statusFilter !== 'all' || cityFilter !== 'all') ? (
            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCityFilter('all'); }}
              className="text-xs text-purple-600 hover:text-purple-700 font-semibold border border-purple-300 px-3 py-1 rounded-lg hover:bg-purple-50 transition-all">
              Clear Filters
            </button>
          ) : <span />}
          <button onClick={() => { resetBdFilters(); setBulkDeleteModalOpen(true); }}
            className="flex items-center gap-1 text-xs text-red-700 font-semibold border border-red-300 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all">
            <Trash2 size={12} /> Bulk Delete
          </button>
        </div>
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Score</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Assigned To</th>
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
                    <td className="px-2 py-1.5">
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
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-medium text-gray-700">{lead.father_name || '-'}</span>
                    </td>

                    {/* Mobile Number */}
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 w-fit">
                        <Phone size={11} className="text-blue-600" />
                        <a href={`tel:${lead.phone}`} className="text-[10px] font-semibold text-blue-700 hover:underline">{lead.phone}</a>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-2 py-1.5">
                      {(() => {
                        const scoreVal = lead.course?.toLowerCase() === 'other' ? lead.other_score : lead.neet;
                        return scoreVal ? (
                          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                            <Target size={11} />
                            {scoreVal}
                          </div>
                        ) : <span className="text-[10px] text-gray-400">-</span>;
                      })()}
                    </td>

                    {/* City */}
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                        <MapPin size={11} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">{lead.city || '-'}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-2 py-1.5">
                      <div className="space-y-1">
                        <div>
                          {getStatusBadge(lead.status)}
                        </div>
                        {!!lead.is_transferred && (
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

                    {/* Assigned To */}
                    <td className="px-2 py-1.5">
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
                    <td className="px-2 py-1.5 max-w-[180px]">
                      <div
                        onClick={() => openRemarkModal(lead)}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 px-2 py-1.5 rounded-md border border-purple-200 cursor-pointer hover:from-purple-100 hover:to-pink-100 transition-all group"
                      >
                        <div className="flex items-center gap-1">
                          <MessageSquare size={10} className="text-purple-600 flex-shrink-0" />
                          <div className="text-[10px] text-purple-800 truncate font-medium group-hover:font-bold">
                            {lead.latest_call_remark || lead.remark || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-2 py-1.5">
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
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold shadow-sm"
                          >
                            <Edit2 size={10} />
                            Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold shadow-sm"
                        >
                          <Edit2 size={10} />
                          Edit
                        </button>
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

      {/* Remark Modal */}
      {remarkModal && selectedRemark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Call Remark</h2>
                    <p className="text-purple-100 text-sm">{selectedRemark.leadName}</p>
                  </div>
                </div>
                <button onClick={closeRemarkModal} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Lead Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Phone size={16} className="text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-blue-500 font-semibold uppercase">Mobile</p>
                    <p className="font-bold text-blue-800 text-sm">{selectedRemark.phone || '-'}</p>
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Target size={16} className="text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-purple-500 font-semibold uppercase">Course / Score</p>
                    <p className="font-bold text-purple-800 text-sm">{selectedRemark.course || '-'} {selectedRemark.score ? `· ${selectedRemark.score}` : ''}</p>
                  </div>
                </div>
              </div>

              {/* Next Follow-up — prominent */}
              {selectedRemark.nextFollowUp ? (
                <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border-2 ${isOverdue(selectedRemark.nextFollowUp) ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
                  <Calendar size={22} className={isOverdue(selectedRemark.nextFollowUp) ? 'text-red-600' : 'text-orange-600'} />
                  <div>
                    <p className={`text-xs font-bold uppercase ${isOverdue(selectedRemark.nextFollowUp) ? 'text-red-600' : 'text-orange-600'}`}>
                      {isOverdue(selectedRemark.nextFollowUp) ? '⚠️ Follow-up Overdue!' : '📅 Next Follow-up'}
                    </p>
                    <p className={`font-bold text-base ${isOverdue(selectedRemark.nextFollowUp) ? 'text-red-800' : 'text-orange-800'}`}>
                      {new Date(selectedRemark.nextFollowUp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border-2 bg-gray-50 border-gray-200">
                  <Calendar size={22} className="text-gray-400" />
                  <p className="text-gray-500 font-semibold text-sm">No follow-up scheduled</p>
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b-2 border-purple-200 pb-2">
                  <MessageSquare size={20} className="text-purple-600" />
                  Complete Call History ({callHistory.length} calls)
                </h3>
                {historyLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading call history...</p>
                  </div>
                ) : callHistory.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <MessageSquare className="mx-auto text-gray-300 mb-2" size={40} />
                    <p className="text-gray-500">No call history yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callHistory.map((call, index) => (
                      <div key={call.id} className={`relative pl-8 pb-4 ${index !== callHistory.length - 1 ? 'border-l-2 border-purple-200' : ''}`}>
                        <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-purple-600 border-4 border-white shadow-md"></div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm">
                          <div className="flex items-center justify-between mb-3 border-b border-purple-200 pb-2">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-purple-600" />
                              <span className="font-bold text-purple-900">{call.caller_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-purple-700">
                              <Calendar size={12} />
                              {new Date(call.call_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white/60 px-3 py-2 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Outcome</p>
                              <p className="font-bold text-sm text-gray-900">{call.call_outcome}</p>
                            </div>
                            {call.next_followup_date && (
                              <div className="bg-orange-100 px-3 py-2 rounded-lg col-span-2 border border-orange-300">
                                <p className="text-xs text-orange-700 mb-1">Scheduled Follow-up</p>
                                <p className="font-bold text-sm text-orange-900">
                                  {new Date(call.next_followup_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-purple-200">
                            <p className="text-xs font-semibold text-purple-700 mb-1">Call Remark:</p>
                            <p className="text-sm text-gray-800 leading-relaxed">{call.call_remark}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
              <button onClick={closeRemarkModal} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => { setEditModalOpen(false); setEditFormData(null); setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '' }); }} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name *</label>
                  <input type="text" value={editFormData.name || ''} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                  <input type="text" value={editFormData.phone || ''} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" />
                </div>
                {/* City */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input type="text" value={editFormData.city || ''} onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="City name" />
                </div>
                {/* Course */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course</label>
                  <select value={editFormData.course || 'MBBS'} onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none">
                    <option value="MBBS">MBBS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* MBBS: NEET Score */}
                {(editFormData.course === 'MBBS' || !editFormData.course) && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NEET Score</label>
                    <input type="text" value={editFormData.neet || ''} onChange={(e) => setEditFormData({ ...editFormData, neet: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="e.g. 520" />
                  </div>
                )}

                {/* Other: Exam/Score */}
                {editFormData.course === 'Other' && (
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Exam / Score</label>
                    <input type="text" value={editFormData.neet || ''} onChange={(e) => setEditFormData({ ...editFormData, neet: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="e.g. JEE 85%, CLAT 120" />
                  </div>
                )}

                {/* Common fields for both courses */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email ID</label>
                  <input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="student@gmail.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
                  <input type="text" value={editFormData.father_name || ''} onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="Father's full name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Father Mobile Number</label>
                  <input type="text" value={editFormData.father_phone || ''} onChange={(e) => setEditFormData({ ...editFormData, father_phone: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="Father's mobile" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Preferred Destination</label>
                  <input type="text" value={editFormData.destination || ''} onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })} className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-indigo-500 outline-none" placeholder="e.g. Russia, Philippines" />
                </div>
              </div>

              {/* Call Log Section */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 space-y-3">
                <p className="text-xs font-bold text-purple-700">Call Log (Optional)</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Call Outcome</label>
                  <select
                    value={callLogData.callOutcome}
                    onChange={(e) => setCallLogData({ ...callLogData, callOutcome: e.target.value })}
                    className="w-full px-3 py-2 text-sm border-2 border-purple-200 rounded-lg focus:border-purple-500 outline-none bg-white"
                  >
                    <option value="">-- Select --</option>
                    <option value="Interested">⭐ Interested</option>
                    <option value="Follow Up">📋 Follow Up</option>
                    <option value="Call Back">🔄 Call Back</option>
                    <option value="Office Visit">🏢 Office Visit</option>
                    <option value="After Result / Counseling">🎓 After Result / Counseling</option>
                    <option value="Other Course">📚 Other Course</option>
                    <option value="Not Interested">✖ Not Interested</option>
                    <option value="Drop">❌ Drop</option>
                    <option value="Invalid Lead">🚫 Invalid Lead</option>
                  </select>
                </div>
                {['Call Back', 'Follow Up', 'Interested', 'Office Visit', 'After Result / Counseling'].includes(callLogData.callOutcome) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Follow-up Date {['Call Back', 'Follow Up'].includes(callLogData.callOutcome) && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="date"
                      value={callLogData.nextFollowUpDate}
                      onChange={(e) => setCallLogData({ ...callLogData, nextFollowUpDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-purple-200 rounded-lg focus:border-purple-500 outline-none bg-white"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-purple-700 mb-1">Remark *</label>
                  <textarea
                    value={callLogData.callRemark}
                    onChange={(e) => setCallLogData({ ...callLogData, callRemark: e.target.value })}
                    rows={2}
                    placeholder="Enter call remarks..."
                    className="w-full px-3 py-2 text-sm border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => { setEditModalOpen(false); setEditFormData(null); setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '' }); }}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add {newLeadType === 'raw' ? 'Raw' : 'Qualified'} Lead</h2>
                    <p className="text-purple-100 text-sm">Will be auto-assigned to you • Name & Phone required</p>
                  </div>
                </div>
                <button
                  onClick={() => { setAddModalOpen(false); resetAddForm(); }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleAddLead} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Lead Type Selection */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-purple-300">
                <label className="block text-sm font-bold text-gray-800 mb-2">Select Lead Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewLeadType('raw')}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      newLeadType === 'raw'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    🆕 Raw Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewLeadType('qualified')}
                    className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                      newLeadType === 'qualified'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    ⭐ Qualified Lead
                  </button>
                </div>
              </div>

              {/* Lead Fields */}
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      value={addFormData.name}
                      onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Student name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={addFormData.fatherName}
                      onChange={(e) => setAddFormData({ ...addFormData, fatherName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Father's name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      maxLength="10"
                      minLength="10"
                      pattern="[0-9]{10}"
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="10-digit mobile"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={addFormData.city}
                      onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                    <input
                      type="text"
                      value={addFormData.source}
                      onChange={(e) => setAddFormData({ ...addFormData, source: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="e.g. Google, Facebook, Referral"
                    />
                  </div>

                  {/* Qualified Lead Additional Fields */}
                  {newLeadType === 'qualified' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                        <select
                          value={addFormData.status || 'Followup'}
                          onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        >
                          <option value="Interested">Interested</option>
                          <option value="Office Visit">Office Visit</option>
                          <option value="Counseling Done">Counseling Done</option>
                          <option value="Follow Up">Follow Up</option>
                          <option value="After Result / Counseling">After Result / Counseling</option>
                          <option value="India">India</option>
                          <option value="Call Back">Call Back</option>
                          <option value="Other Course">Other Course</option>
                          <option value="Drop">Drop</option>
                          <option value="Not Interested">Not Interested</option>
                          <option value="Invalid Lead">Invalid Lead</option>
                          <option value="Converted">Converted</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Course Type</label>
                        <select
                          value={addFormData.course}
                          onChange={(e) => setAddFormData({ ...addFormData, course: e.target.value, neetPrevious: '', neet2026: '', score: '' })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        >
                          <option value="">-- Select Course --</option>
                          <option value="MBBS">MBBS</option>
                          <option value="BAMS/BDS">BAMS / BDS</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {(addFormData.course === 'MBBS' || addFormData.course === 'BAMS/BDS') && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">NEET Previous Year</label>
                            <input
                              type="text"
                              value={addFormData.neetPrevious}
                              onChange={(e) => setAddFormData({ ...addFormData, neetPrevious: e.target.value })}
                              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                              placeholder="Previous NEET score"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">NEET 2026</label>
                            <input
                              type="text"
                              value={addFormData.neet2026}
                              onChange={(e) => setAddFormData({ ...addFormData, neet2026: e.target.value })}
                              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                              placeholder="NEET 2026 score"
                            />
                          </div>
                        </>
                      )}
                      {addFormData.course === 'Other' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Score</label>
                          <input
                            type="text"
                            value={addFormData.score || ''}
                            onChange={(e) => setAddFormData({ ...addFormData, score: e.target.value })}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                            placeholder="Enter exam score"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Interested Location</label>
                        <select
                          value={addFormData.destination}
                          onChange={(e) => setAddFormData({ ...addFormData, destination: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        >
                          <option value="">-- Select --</option>
                          <option value="India">India</option>
                          <option value="Abroad">Abroad</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Follow Up</label>
                        <input
                          type="datetime-local"
                          value={addFormData.nextFollowUpDate}
                          onChange={(e) => setAddFormData({ ...addFormData, nextFollowUpDate: e.target.value })}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Remark - common for both */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Remark</label>
                    <textarea
                      value={addFormData.remark}
                      onChange={(e) => setAddFormData({ ...addFormData, remark: e.target.value })}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Any additional notes..."
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setAddModalOpen(false); resetAddForm(); }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm disabled:opacity-50"
                >
                  {addSaving ? 'Adding...' : 'Add Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Trash2 className="text-red-600" size={18} />
                <h2 className="text-base font-bold text-gray-900">Bulk Delete Leads</h2>
              </div>
              <button onClick={() => setBulkDeleteModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Trash2 className="text-red-600 flex-shrink-0 mt-0.5" size={14} />
                <p className="text-red-700 text-xs font-medium">Permanent action — deleted leads cannot be recovered!</p>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1"><Filter size={11}/> Quick Select</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Not Interested', 'Drop', 'Invalid Lead'].map(status => (
                    <button key={status} onClick={() => { setBdStatusFilter(status); setBdSelectedIds([]); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${bdStatusFilter === status ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-300 hover:bg-red-50'}`}>
                      {status} ({leads.filter(l => l.status === status).length})
                    </button>
                  ))}
                  <button onClick={resetBdFilters} className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">Clear</button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-2">
                <select value={bdStatusFilter} onChange={e => { setBdStatusFilter(e.target.value); setBdSelectedIds([]); }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white outline-none focus:border-red-400">
                  <option value="all">All Statuses</option>
                  {bdUniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={bdCityFilter} onChange={e => { setBdCityFilter(e.target.value); setBdSelectedIds([]); }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white outline-none focus:border-red-400">
                  <option value="all">All Cities</option>
                  {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <input type="text" placeholder="Search by name, phone, city..."
                value={bdSearchTerm} onChange={e => { setBdSearchTerm(e.target.value); setBdSelectedIds([]); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox"
                    checked={bdFilteredLeads.length > 0 && bdSelectedIds.length === bdFilteredLeads.length}
                    onChange={() => {
                      if (bdSelectedIds.length === bdFilteredLeads.length && bdFilteredLeads.length > 0) setBdSelectedIds([]);
                      else setBdSelectedIds(bdFilteredLeads.map(l => l.id));
                    }}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm font-semibold text-gray-700">Select All ({bdFilteredLeads.length})</span>
                </label>
                {bdSelectedIds.length > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">{bdSelectedIds.length} selected</span>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[30vh] overflow-y-auto">
                {bdFilteredLeads.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No leads found</div>
                ) : (
                  bdFilteredLeads.map((lead, idx) => (
                    <label key={lead.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all ${bdSelectedIds.includes(lead.id) ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50'} ${idx !== 0 ? 'border-t border-gray-100' : ''}`}>
                      <input type="checkbox" checked={bdSelectedIds.includes(lead.id)}
                        onChange={() => setBdSelectedIds(prev => prev.includes(lead.id) ? prev.filter(i => i !== lead.id) : [...prev, lead.id])}
                        className="w-4 h-4 accent-red-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.name}</p>
                        <p className="text-xs text-gray-500 truncate">{lead.phone} · {lead.city || '—'} · {lead.status}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gray-50 border-t p-4 flex items-center justify-between rounded-b-2xl">
              <button onClick={() => setBulkDeleteModalOpen(false)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all text-sm">Cancel</button>
              <button onClick={handleBulkDelete} disabled={bdSelectedIds.length === 0 || bdDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all text-sm disabled:opacity-50 flex items-center gap-2">
                <Trash2 size={14} />
                {bdDeleting ? 'Deleting...' : `Delete ${bdSelectedIds.length > 0 ? `${bdSelectedIds.length} Leads` : 'Selected'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelecallerLeads;
