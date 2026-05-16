import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserCheck, Phone, User, RefreshCw, CheckCircle, Target, MapPin, GraduationCap, MessageSquare, X, Calendar, Edit2, Trash2, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSuperAdmin } from '../utils/permissions';
import API_URL from '../config/api';

const AssignedLeads = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedLeadId = searchParams.get('highlight');
  const statusFromUrl = searchParams.get('status');
  const [highlightId, setHighlightId] = useState(null);
  const leadRefs = useRef({});

  const [assignedLeads, setAssignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(statusFromUrl || 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const LEADS_PER_PAGE = 10;
  const [leadTypeFilter, setLeadTypeFilter] = useState('all'); // 'all', 'raw', 'qualified'
  const [courseFilter, setCourseFilter] = useState('all'); // 'all', 'MBBS', 'Other'
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkModal, setRemarkModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [telecallers, setTelecallers] = useState([]);
  // Call log fields for edit modal
  const [callLogData, setCallLogData] = useState({
    callOutcome: '',
    callRemark: '',
    nextFollowUpDate: '',
    callReason: ''
  });
  const [addingCallLog, setAddingCallLog] = useState(false);

  useEffect(() => {
    fetchAssignedLeads();
    fetchTelecallers();
  }, []);

  // Handle highlighted lead from URL parameter
  useEffect(() => {
    if (highlightedLeadId && assignedLeads.length > 0) {
      const leadId = parseInt(highlightedLeadId);
      setHighlightId(leadId);

      // Find the lead and open edit modal
      const lead = assignedLeads.find(l => l.id === leadId);
      if (lead) {
        setEditFormData(lead);
        setEditModalOpen(true);

        // Scroll to the lead row after a short delay
        setTimeout(() => {
          if (leadRefs.current[leadId]) {
            leadRefs.current[leadId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }

      // Clear the URL parameter
      setSearchParams({});

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightId(null);
      }, 5000);
    }
  }, [highlightedLeadId, assignedLeads]);

  const fetchTelecallers = async () => {
    try {
      const response = await fetch(`${API_URL}/users/role/telecaller`);
      const result = await response.json();
      if (result.success) {
        setTelecallers(result.data);
      }
    } catch (err) {
      console.error('Error fetching telecallers:', err);
    }
  };

  // Edit lead handler
  const handleEditLead = (lead) => {
    setEditFormData({ ...lead });
    // Reset call log data when opening edit modal
    setCallLogData({
      callOutcome: '',
      callRemark: '',
      nextFollowUpDate: '',
      callReason: ''
    });
    setEditModalOpen(true);
  };

  // Update lead handler
  const handleUpdateLead = async () => {
    if (!editFormData) return;

    try {
      // First update the lead data
      const response = await fetch(`${API_URL}/leads/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      const result = await response.json();
      if (!result.success) {
        alert('Failed to update lead: ' + result.message);
        return;
      }

      // If call log fields are filled, add a call log entry
      if (callLogData.callOutcome && callLogData.callRemark) {
        setAddingCallLog(true);
        try {
          const callLogResponse = await fetch(`${API_URL}/leads/${editFormData.id}/call-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callerId: user.id,
              callerName: user.name || 'Super Admin',
              callRemark: callLogData.callRemark,
              callOutcome: callLogData.callOutcome,
              callReason: callLogData.callReason || null,
              nextFollowUpDate: callLogData.nextFollowUpDate || null,
              isSuperAdmin: true // Skip validations for Super Admin
            })
          });

          const callLogResult = await callLogResponse.json();
          if (!callLogResult.success) {
            alert('Lead updated but call log failed: ' + callLogResult.message);
            setAddingCallLog(false);
            setEditModalOpen(false);
            setEditFormData(null);
            fetchAssignedLeads();
            return;
          }
        } catch (callLogErr) {
          console.error('Error adding call log:', callLogErr);
          alert('Lead updated but call log failed. Check console for details.');
        }
        setAddingCallLog(false);
      }

      alert('Lead updated successfully!');
      setEditModalOpen(false);
      setEditFormData(null);
      setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '', callReason: '' });
      fetchAssignedLeads();
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Error updating lead. Check console for details.');
    }
  };

  // Delete lead handler
  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        alert('Lead deleted successfully!');
        fetchAssignedLeads();
      } else {
        alert('Failed to delete lead: ' + result.message);
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Error deleting lead. Check console for details.');
    }
  };

  const fetchAssignedLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/leads`);
      const result = await response.json();

      if (result.success) {
        // Filter only assigned leads (where assigned_to is not null)
        // AND exclude converted leads (they appear in Converted Leads page)
        const assigned = result.data.filter(lead =>
          lead.assigned_to !== null && lead.status !== 'Converted'
        );
        setAssignedLeads(assigned);
      }
    } catch (error) {
      console.error('Error fetching assigned leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a lead is raw (not qualified)
  // Raw = No NEET, Course, Destination (qualification fields only, not remark/source)
  const isRawLead = (lead) => {
    const isEmpty = (field) => !field || field === null || field === undefined || field.toString().trim() === '';
    return isEmpty(lead.neet) && isEmpty(lead.course) && isEmpty(lead.destination);
  };

  // Filter leads based on active tab, lead type filter, course filter, status, city, and assigned to
  const getFilteredLeads = () => {
    let filtered = assignedLeads;

    // First filter by lead type (raw/qualified)
    if (leadTypeFilter === 'raw') {
      filtered = filtered.filter(lead => isRawLead(lead));
    } else if (leadTypeFilter === 'qualified') {
      filtered = filtered.filter(lead => !isRawLead(lead));
    }

    // Filter by course type (MBBS/Other)
    if (courseFilter !== 'all') {
      filtered = filtered.filter(lead =>
        lead.course?.toLowerCase() === courseFilter.toLowerCase()
      );
    }

    // Filter by status dropdown
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Filter by city
    if (cityFilter !== 'all') {
      filtered = filtered.filter(lead => lead.city === cityFilter);
    }

    // Filter by assigned to
    if (assignedFilter !== 'all') {
      filtered = filtered.filter(lead => lead.assigned_to_name === assignedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(q) ||
        lead.phone?.includes(q) ||
        lead.city?.toLowerCase().includes(q) ||
        lead.father_name?.toLowerCase().includes(q) ||
        lead.assigned_to_name?.toLowerCase().includes(q)
      );
    }

    // Then filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(lead => lead.status === activeTab);
    }

    return filtered;
  };

  const filteredLeads = getFilteredLeads();

  // Pagination calculations
  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + LEADS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, leadTypeFilter, courseFilter, statusFilter, cityFilter, assignedFilter]);

  // Calculate raw and qualified counts
  const rawCount = assignedLeads.filter(lead => isRawLead(lead)).length;
  const qualifiedCount = assignedLeads.filter(lead => !isRawLead(lead)).length;

  // Calculate MBBS and Other counts
  const mbbsCount = assignedLeads.filter(lead => lead.course?.toLowerCase() === 'mbbs').length;
  const otherCount = assignedLeads.filter(lead => lead.course?.toLowerCase() === 'other').length;

  // Calculate counts for tabs (Converted leads removed - see Converted Leads page)
  const counts = {
    all: assignedLeads.length,
    'Interested': assignedLeads.filter(l => l.status === 'Interested').length,
    'Follow Up': assignedLeads.filter(l => l.status === 'Follow Up').length,
    'Call Back': assignedLeads.filter(l => l.status === 'Call Back').length,
    'Office Visit': assignedLeads.filter(l => l.status === 'Office Visit').length,
    'After Result / Counseling': assignedLeads.filter(l => l.status === 'After Result / Counseling').length,
    'Other Course': assignedLeads.filter(l => l.status === 'Other Course').length,
    'Not Interested': assignedLeads.filter(l => l.status === 'Not Interested').length,
    'Drop': assignedLeads.filter(l => l.status === 'Drop').length,
    'Invalid Lead': assignedLeads.filter(l => l.status === 'Invalid Lead').length,
  };

  const tabs = [
    { id: 'all', label: 'All Assigned', count: counts.all },
    { id: 'Interested', label: 'Interested', count: counts['Interested'] },
    { id: 'Follow Up', label: 'Follow Up', count: counts['Follow Up'] },
    { id: 'Call Back', label: 'Call Back', count: counts['Call Back'] },
    { id: 'Office Visit', label: 'Office Visit', count: counts['Office Visit'] },
    { id: 'After Result / Counseling', label: 'After Result', count: counts['After Result / Counseling'] },
    { id: 'Other Course', label: 'Other Course', count: counts['Other Course'] },
    { id: 'Not Interested', label: 'Not Interested', count: counts['Not Interested'] },
    { id: 'Drop', label: 'Drop', count: counts['Drop'] },
    { id: 'Invalid Lead', label: 'Invalid Lead', count: counts['Invalid Lead'] },
  ];

  const openRemarkModal = async (lead) => {
    setSelectedRemark({
      remark: lead.latest_call_remark || lead.remark || 'No remark available',
      leadName: lead.name,
      leadId: lead.id,
      nextFollowUp: lead.next_followup_date,
      callDate: lead.latest_call_date
    });
    setRemarkModal(true);

    // Fetch complete call history
    setHistoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/leads/${lead.id}/call-history`);
      const data = await response.json();
      if (data.success) {
        setCallHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeRemarkModal = () => {
    setRemarkModal(false);
    setSelectedRemark(null);
    setCallHistory([]);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Interested': 'bg-purple-100 text-purple-800 border-purple-300',
      'Follow Up': 'bg-blue-100 text-blue-800 border-blue-300',
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
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const truncateText = (text, maxLength = 40) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-semibold">Loading assigned leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">Assigned Leads</h1>
            <p className="text-gray-500 text-xs md:text-sm">Track all leads assigned to telecallers</p>
          </div>
          <button
            onClick={fetchAssignedLeads}
            className="flex items-center gap-1 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-xs md:text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md"
          >
            <RefreshCw size={16} className="md:w-5 md:h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 mb-3 md:mb-4 border border-gray-100">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city, father's name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none text-xs md:text-sm"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
          {/* Lead Type Filter */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Lead Type:</label>
            <select
              value={leadTypeFilter}
              onChange={(e) => setLeadTypeFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-blue-300 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Leads</option>
              <option value="raw">Raw ({rawCount})</option>
              <option value="qualified">Qualified ({qualifiedCount})</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Course:</label>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-purple-300 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Course</option>
              <option value="MBBS">MBBS ({mbbsCount})</option>
              <option value="Other">Other ({otherCount})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Statuses</option>
              {[...new Set(assignedLeads.map(lead => lead.status).filter(status => status))]
                .sort()
                .map(status => (
                  <option key={status} value={status}>{status}</option>
                ))
              }
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">City:</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Cities</option>
              {[...new Set(assignedLeads.map(lead => lead.city).filter(city => city))]
                .sort()
                .map(city => (
                  <option key={city} value={city}>{city}</option>
                ))
              }
            </select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Assigned To:</label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Users</option>
              {[...new Set(assignedLeads.map(lead => lead.assigned_to_name).filter(name => name))]
                .sort()
                .map(name => (
                  <option key={name} value={name}>{name}</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(leadTypeFilter !== 'all' || courseFilter !== 'all' || statusFilter !== 'all' || cityFilter !== 'all' || assignedFilter !== 'all') && (
          <div className="mt-3 md:mt-4 flex justify-end">
            <button
              onClick={() => {
                setLeadTypeFilter('all');
                setCourseFilter('all');
                setStatusFilter('all');
                setCityFilter('all');
                setAssignedFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-purple-600 hover:text-purple-700 font-semibold text-sm border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Total Assigned</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{counts.all}</p>
            </div>
            <UserCheck className="text-blue-500 hidden md:block" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Raw Leads</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{rawCount}</p>
            </div>
            <Target className="text-orange-500 hidden md:block" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Qualified Leads</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{qualifiedCount}</p>
            </div>
            <CheckCircle className="text-green-500 hidden md:block" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Interested</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{counts.Interested}</p>
            </div>
            <UserCheck className="text-purple-500 hidden md:block" size={28} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-80">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Leads Table */}
      {filteredLeads.length > 0 ? (
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Assigned To</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50">
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    ref={(el) => leadRefs.current[lead.id] = el}
                    className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 transition-all duration-200 hover:shadow-sm group ${
                      highlightId === lead.id
                        ? 'bg-yellow-100 ring-2 ring-yellow-400 animate-pulse'
                        : 'bg-white'
                    }`}
                  >
                    {/* Student Name */}
                    <td className="px-2 py-1.5">
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
                    {/* Father's Name */}
                    <td className="px-2 py-1.5">
                      <span className="text-[10px] font-medium text-gray-700">{lead.father_name || '-'}</span>
                    </td>
                    {/* Mobile Number */}
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 w-fit">
                        <Phone size={11} className="text-blue-600" />
                        <a href={`tel:${lead.phone}`} className="text-[10px] font-semibold text-blue-700 truncate max-w-[100px] hover:underline">{lead.phone}</a>
                      </div>
                    </td>
                    {/* NEET Score */}
                    <td className="px-2 py-1.5">
                      <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                        <Target size={11} />
                        {lead.neet || '-'}
                      </div>
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
                      {getStatusBadge(lead.status)}
                    </td>
                    {/* Sub Status */}
                    <td className="px-2 py-1.5">
                      {lead.latest_call_reason ? (
                        <span className="inline-block bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md text-[10px] font-medium">
                          {lead.latest_call_reason}
                        </span>
                      ) : <span className="text-[10px] text-gray-400">-</span>}
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
                            {truncateText(lead.latest_call_remark || lead.remark)}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Action */}
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1">
                        {isSuperAdmin(user) && (
                          <>
                            <button
                              onClick={() => handleEditLead(lead)}
                              className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-all"
                              title="Edit Lead"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteLead(lead.id)}
                              className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                              title="Delete Lead"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{startIndex + 1}-{Math.min(startIndex + LEADS_PER_PAGE, filteredLeads.length)}</span> of <span className="font-semibold">{filteredLeads.length}</span> leads
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <UserCheck className="mx-auto mb-4 text-gray-300" size={64} />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No assigned leads yet</h3>
          <p className="text-gray-500">Assigned leads will appear here</p>
        </div>
      )}

      {/* Remark Modal */}
      {remarkModal && selectedRemark && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Call Remark</h2>
                    <p className="text-purple-100 text-sm">{selectedRemark.leadName}</p>
                  </div>
                </div>
                <button
                  onClick={closeRemarkModal}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Next Follow-up */}
              {selectedRemark.nextFollowUp && (
                <div className="flex items-center gap-2 text-sm mb-4 bg-orange-50 px-4 py-3 rounded-lg border-2 border-orange-200">
                  <Calendar size={18} className="text-orange-600" />
                  <div>
                    <span className="font-bold text-orange-900">Next Follow-up:</span>
                    <span className="ml-2 text-orange-700 font-semibold">
                      {new Date(selectedRemark.nextFollowUp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Call History Timeline */}
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
                      <div
                        key={call.id}
                        className={`relative pl-8 pb-4 ${
                          index !== callHistory.length - 1 ? 'border-l-2 border-purple-200' : ''
                        }`}
                      >
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-purple-600 border-4 border-white shadow-md"></div>

                        {/* Call Card */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200 shadow-sm hover:shadow-md transition-all">
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3 border-b border-purple-200 pb-2">
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-purple-600" />
                              <span className="font-bold text-purple-900">{call.caller_name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-purple-700">
                              <Calendar size={12} />
                              {new Date(call.call_date).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="bg-white/60 px-3 py-2 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">Outcome</p>
                              <p className="font-bold text-sm text-gray-900">{call.call_outcome}</p>
                            </div>
                            {call.duration && (
                              <div className="bg-white/60 px-3 py-2 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Duration</p>
                                <p className="font-bold text-sm text-gray-900">{call.duration} min</p>
                              </div>
                            )}
                            {call.call_reason && (
                              <div className="bg-white/60 px-3 py-2 rounded-lg col-span-2">
                                <p className="text-xs text-gray-600 mb-1">Reason</p>
                                <p className="font-bold text-sm text-red-700">{call.call_reason}</p>
                              </div>
                            )}
                            {call.next_followup_date && (
                              <div className="bg-orange-100 px-3 py-2 rounded-lg col-span-2 border border-orange-300">
                                <p className="text-xs text-orange-700 mb-1">Scheduled Follow-up</p>
                                <p className="font-bold text-sm text-orange-900">
                                  {new Date(call.next_followup_date).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Remark */}
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

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={closeRemarkModal}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-2xl w-full my-4 md:my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 md:p-6 rounded-t-xl md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Edit2 size={16} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold">Edit Lead</h2>
                    <p className="text-blue-100 text-xs md:text-sm">Update lead information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditFormData(null);
                  }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={16} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 md:p-6 space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Phone *</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Father's Name</label>
                  <input
                    type="text"
                    value={editFormData.father_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Father's full name"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Father Mobile Number</label>
                  <input
                    type="text"
                    value={editFormData.father_phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, father_phone: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Father's mobile number"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Course</label>
                  <select
                    value={editFormData.course || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="">-- Select --</option>
                    <option value="MBBS">MBBS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">
                    {editFormData.course === 'MBBS' ? 'NEET Score' : 'Score'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.neet || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, neet: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder={editFormData.course === 'MBBS' ? 'Enter NEET marks/rank' : 'Enter score'}
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Destination Country</label>
                  <input
                    type="text"
                    value={editFormData.destination || editFormData.destination_country || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="e.g. Russia, Kazakhstan"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Source</label>
                  <input
                    type="text"
                    value={editFormData.source || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="e.g. Google, Facebook"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Status</label>
                  <div className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-100 bg-gray-50 rounded-lg md:rounded-xl text-gray-700 font-semibold select-none cursor-not-allowed">
                    {editFormData.status || '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Next Follow-up Date</label>
                  <input
                    type="datetime-local"
                    value={editFormData.next_followup_date ? new Date(editFormData.next_followup_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditFormData({ ...editFormData, next_followup_date: e.target.value })}
                    className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Assigned To</label>
                  <div className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-100 bg-gray-50 rounded-lg md:rounded-xl text-gray-700 font-semibold select-none cursor-not-allowed">
                    {editFormData.assigned_to_name || 'Unassigned'}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-2">Remark</label>
                <textarea
                  value={editFormData.remark || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, remark: e.target.value })}
                  rows="3"
                  className="w-full px-2 md:px-4 py-1.5 md:py-2 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Add any remarks..."
                ></textarea>
              </div>

              {/* Call Log Section - Add entry to call history */}
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t-2 border-purple-200">
                <div className="flex items-center gap-1 md:gap-2 mb-3 md:mb-4">
                  <MessageSquare size={16} className="text-purple-600 md:w-5 md:h-5" />
                  <h3 className="text-sm md:text-lg font-bold text-purple-800">Add to Call History</h3>
                  <span className="text-[10px] md:text-xs text-gray-500 hidden md:inline">(Optional)</span>
                </div>

                <div className="space-y-3 bg-purple-50 p-2 md:p-4 rounded-lg md:rounded-xl border border-purple-200">
                  {/* 1. Outcome */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-purple-700 mb-1 md:mb-2">Outcome *</label>
                    <select
                      value={callLogData.callOutcome}
                      onChange={(e) => setCallLogData({ ...callLogData, callOutcome: e.target.value, callReason: '' })}
                      className="w-full px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border-2 border-purple-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
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
                      {(user?.role === 'Super Admin' || user?.role === 'Manager' || user?.role === 'Admin') && (
                        <option value="Converted">✅ Converted</option>
                      )}
                    </select>
                  </div>

                  {/* 2. Sub Category */}
                  {callLogData.callOutcome && {
                    'Interested': [
                      { value: 'India', label: '🇮🇳 India' },
                      { value: 'Abroad', label: '🌍 Abroad' },
                      { value: 'Counselling Only', label: '💬 Counselling Only' },
                      { value: 'BDS / BAMS', label: '🦷 BDS / BAMS' },
                    ],
                    'Follow Up': [
                      { value: 'Details Shared', label: '📋 Details Shared' },
                      { value: 'Discussed on Phone', label: '📞 Discussed on Phone' },
                      { value: 'Documents Pending', label: '📄 Documents Pending' },
                      { value: 'Meeting Planned', label: '📅 Meeting Planned' },
                    ],
                    'Call Back': [
                      { value: 'Not Reachable', label: '📴 Not Reachable' },
                      { value: 'Busy', label: '📵 Busy' },
                      { value: 'Call Back 2-3 Days', label: '🔄 Call Back 2–3 Days' },
                      { value: 'Call Back Next Week', label: '📆 Call Back Next Week' },
                    ],
                    'Office Visit': [
                      { value: 'Address Shared', label: '📍 Address Shared' },
                      { value: 'Visit Scheduled', label: '📅 Visit Scheduled' },
                      { value: 'Visit Done', label: '✅ Visit Done' },
                    ],
                    'After Result / Counseling': [
                      { value: 'Waiting NEET Result', label: '⏳ Waiting NEET Result' },
                      { value: 'Waiting Counseling', label: '🎓 Waiting Counseling' },
                    ],
                    'Other Course': [
                      { value: 'B.Tech / Biotech', label: '🔧 B.Tech / Biotech' },
                      { value: 'B.Sc. / BCom / BA', label: '📚 B.Sc. / BCom / BA' },
                      { value: 'Allied Health Sciences', label: '🏥 Allied Health Sciences' },
                      { value: 'Other Professional Courses', label: '🎯 Other Professional Courses' },
                    ],
                    'Not Interested': [
                      { value: 'Budget Issue', label: '💰 Budget Issue' },
                      { value: 'Parents Not Agree', label: '👨‍👩‍👧 Parents Not Agree' },
                      { value: 'Already Admission Taken', label: '📄 Already Admission Taken' },
                      { value: 'Just Inquiry', label: '❓ Just Inquiry' },
                    ],
                    'Drop': [
                      { value: 'Not Qualified', label: '❌ Not Qualified' },
                      { value: 'Improvement Year', label: '📖 Improvement Year' },
                      { value: 'Financial Problem', label: '💸 Financial Problem' },
                    ],
                    'Invalid Lead': [
                      { value: 'Wrong Number', label: '📞 Wrong Number' },
                      { value: 'Not Reachable', label: '📴 Not Reachable' },
                      { value: 'Fake Inquiry', label: '🚫 Fake Inquiry' },
                    ],
                  }[callLogData.callOutcome] && (
                    <div className={`border-2 rounded-lg md:rounded-xl p-2 md:p-3 ${
                      ['Not Interested', 'Drop', 'Invalid Lead'].includes(callLogData.callOutcome)
                        ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <label className={`block text-xs md:text-sm font-semibold mb-1 md:mb-2 ${
                        ['Not Interested', 'Drop', 'Invalid Lead'].includes(callLogData.callOutcome)
                          ? 'text-red-700' : 'text-blue-700'
                      }`}>{callLogData.callOutcome} - Sub Category *</label>
                      <select
                        value={callLogData.callReason}
                        onChange={(e) => setCallLogData({ ...callLogData, callReason: e.target.value })}
                        className={`w-full px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border-2 rounded-lg md:rounded-xl focus:ring-2 outline-none bg-white ${
                          ['Not Interested', 'Drop', 'Invalid Lead'].includes(callLogData.callOutcome)
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                        }`}
                      >
                        <option value="">-- Select Reason --</option>
                        {{
                          'Interested': [
                            { value: 'India', label: '🇮🇳 India' },
                            { value: 'Abroad', label: '🌍 Abroad' },
                            { value: 'Counselling Only', label: '💬 Counselling Only' },
                            { value: 'BDS / BAMS', label: '🦷 BDS / BAMS' },
                          ],
                          'Follow Up': [
                            { value: 'Details Shared', label: '📋 Details Shared' },
                            { value: 'Discussed on Phone', label: '📞 Discussed on Phone' },
                            { value: 'Documents Pending', label: '📄 Documents Pending' },
                            { value: 'Meeting Planned', label: '📅 Meeting Planned' },
                          ],
                          'Call Back': [
                            { value: 'Not Reachable', label: '📴 Not Reachable' },
                            { value: 'Busy', label: '📵 Busy' },
                            { value: 'Call Back 2-3 Days', label: '🔄 Call Back 2–3 Days' },
                            { value: 'Call Back Next Week', label: '📆 Call Back Next Week' },
                          ],
                          'Office Visit': [
                            { value: 'Address Shared', label: '📍 Address Shared' },
                            { value: 'Visit Scheduled', label: '📅 Visit Scheduled' },
                            { value: 'Visit Done', label: '✅ Visit Done' },
                          ],
                          'After Result / Counseling': [
                            { value: 'Waiting NEET Result', label: '⏳ Waiting NEET Result' },
                            { value: 'Waiting Counseling', label: '🎓 Waiting Counseling' },
                          ],
                          'Other Course': [
                            { value: 'B.Tech / Biotech', label: '🔧 B.Tech / Biotech' },
                            { value: 'B.Sc. / BCom / BA', label: '📚 B.Sc. / BCom / BA' },
                            { value: 'Allied Health Sciences', label: '🏥 Allied Health Sciences' },
                            { value: 'Other Professional Courses', label: '🎯 Other Professional Courses' },
                          ],
                          'Not Interested': [
                            { value: 'Budget Issue', label: '💰 Budget Issue' },
                            { value: 'Parents Not Agree', label: '👨‍👩‍👧 Parents Not Agree' },
                            { value: 'Already Admission Taken', label: '📄 Already Admission Taken' },
                            { value: 'Just Inquiry', label: '❓ Just Inquiry' },
                          ],
                          'Drop': [
                            { value: 'Not Qualified', label: '❌ Not Qualified' },
                            { value: 'Improvement Year', label: '📖 Improvement Year' },
                            { value: 'Financial Problem', label: '💸 Financial Problem' },
                          ],
                          'Invalid Lead': [
                            { value: 'Wrong Number', label: '📞 Wrong Number' },
                            { value: 'Not Reachable', label: '📴 Not Reachable' },
                            { value: 'Fake Inquiry', label: '🚫 Fake Inquiry' },
                          ],
                        }[callLogData.callOutcome]?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 3. Follow-up Date */}
                  {['Interested', 'Follow Up', 'Call Back', 'Office Visit', 'After Result / Counseling'].includes(callLogData.callOutcome) && (
                    <div>
                      <label className="block text-xs md:text-sm font-semibold text-purple-700 mb-1 md:mb-2">
                        Follow-up Date {['Call Back', 'Follow Up'].includes(callLogData.callOutcome) && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="datetime-local"
                        value={callLogData.nextFollowUpDate}
                        onChange={(e) => setCallLogData({ ...callLogData, nextFollowUpDate: e.target.value })}
                        className="w-full px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border-2 border-purple-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                      />
                    </div>
                  )}

                  {/* 4. Remark */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-purple-700 mb-1 md:mb-2">Remark *</label>
                    <textarea
                      value={callLogData.callRemark}
                      onChange={(e) => setCallLogData({ ...callLogData, callRemark: e.target.value })}
                      placeholder="Enter call remarks..."
                      className="w-full px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm border-2 border-purple-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none bg-white"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 md:p-4 rounded-b-xl md:rounded-b-2xl flex items-center justify-end gap-2 md:gap-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditFormData(null);
                  setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '', callReason: '' });
                }}
                className="px-4 md:px-6 py-2 md:py-3 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
                disabled={addingCallLog}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLead}
                disabled={addingCallLog}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                {addingCallLog ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedLeads;
