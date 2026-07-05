import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import API_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Zap, Target, UserCheck, Search, Filter,
  MoreVertical, Phone, Mail, Eye, GraduationCap,
  UserPlus, TrendingUp, Clock, MapPin, Globe, UserCircle, Loader, Upload,
  X, Edit2, Calendar, Plus
} from 'lucide-react';

const Leads = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightedLeadId = searchParams.get('highlight');
  const [highlightId, setHighlightId] = useState(null);
  const leadRefs = useRef({});

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [cityFilter, setCityFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [courseTypeFilter, setCourseTypeFilter] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all'); // All/Raw/Qualified filter
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const LEADS_PER_PAGE = 10;
  const [error, setError] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [telecallers, setTelecallers] = useState([]);
  const [selectedTelecaller, setSelectedTelecaller] = useState('');
  const [assignLeadId, setAssignLeadId] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]); // For bulk selection
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [conflictWarningOpen, setConflictWarningOpen] = useState(false);
  const [conflictLeads, setConflictLeads] = useState([]);
  const [pendingAssign, setPendingAssign] = useState(null); // { assignedTo, assignedToName }
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [callLogData, setCallLogData] = useState({ callOutcome: '', callRemark: '', nextFollowUpDate: '', callReason: '' });
  const [savingCallLog, setSavingCallLog] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newLeadType, setNewLeadType] = useState('raw'); // 'raw' or 'qualified'
  const [newStudent, setNewStudent] = useState({
    name: '',
    fatherName: '',
    phone: '',
    city: '',
    source: '',
    status: 'Followup',
    neetPrevious: '',
    neet2026: '',
    score: '',
    course: '',
    destination: '',
    nextFollowUpDate: '',
    remark: '',
  });

  // Fetch leads from API
  useEffect(() => {
    fetchLeads();
    fetchTelecallers();
  }, []);

  // Handle highlighted lead from URL parameter
  useEffect(() => {
    if (highlightedLeadId && leads.length > 0) {
      const leadId = parseInt(highlightedLeadId);
      setHighlightId(leadId);

      // Find and open the lead
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setSelectedLead(lead);
        setViewModalOpen(true);

        // Scroll to the lead row after a short delay
        setTimeout(() => {
          if (leadRefs.current[leadId]) {
            leadRefs.current[leadId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }

      // Clear the URL parameter after handling
      setSearchParams({});

      // Remove highlight after 5 seconds
      setTimeout(() => {
        setHighlightId(null);
      }, 5000);
    }
  }, [highlightedLeadId, leads]);

  // Helper function to check if a lead is raw (not qualified)
  // A lead is "raw" if it doesn't have NEET, Course, and Destination filled
  // Remark and Source are NOT part of qualification criteria
  const isRawLead = (lead) => {
    const isEmpty = (field) => !field || field === null || field === undefined || field.toString().trim() === '';
    return isEmpty(lead.neet) && isEmpty(lead.course) && isEmpty(lead.destination);
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/leads`);
      const result = await response.json();

      if (result.success) {
        // Show ALL leads (both raw and qualified)
        // Exclude converted leads (they appear in Converted Leads page)
        const allLeads = result.data.filter(lead =>
          lead.status !== 'Converted'
        );
        setLeads(allLeads);
      } else {
        setError('Failed to fetch leads');
      }
    } catch (err) {
      setError('Error connecting to server. Make sure the backend is running on port 5000.');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAssignLead = async () => {
    if (!selectedTelecaller || !assignLeadId) {
      alert('Please select a telecaller');
      return;
    }

    try {
      let assignedTo, assignedToName;

      // Check if self-assign
      if (selectedTelecaller === 'self') {
        if (!user) {
          alert('User not found');
          return;
        }
        assignedTo = user.id;
        assignedToName = user.name;
      } else {
        // Find the selected telecaller's name
        const telecaller = telecallers.find(t => t.id === parseInt(selectedTelecaller));
        if (!telecaller) {
          alert('Telecaller not found');
          return;
        }
        assignedTo = parseInt(selectedTelecaller);
        assignedToName = telecaller.name;
      }

      const response = await fetch(`${API_URL}/leads/${assignLeadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: assignedTo,
          assignedToName: assignedToName
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Lead assigned successfully!');
        setAssignModalOpen(false);
        setSelectedTelecaller('');
        setAssignLeadId(null);
        fetchLeads(); // Refresh leads
      } else {
        alert('Failed to assign lead: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error assigning lead:', err);
      alert('Error assigning lead. Check console for details.');
    }
  };

  // Edit lead handler
  const handleEditLead = (lead) => {
    setEditFormData({ ...lead });
    setEditModalOpen(true);
    setViewModalOpen(false);
  };

  const handleUpdateLead = async () => {
    if (!editFormData) return;

    try {
      const response = await fetch(`${API_URL}/leads/${editFormData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Lead updated successfully!');
        setEditModalOpen(false);
        setEditFormData(null);
        fetchLeads();
      } else {
        alert('Failed to update lead: ' + result.message);
      }
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
        alert('✓ Lead deleted successfully!');
        setViewModalOpen(false);
        fetchLeads();
      } else {
        alert('Failed to delete lead: ' + result.message);
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Error deleting lead. Check console for details.');
    }
  };

  // Add new student handler
  const handleAddStudent = async (e) => {
    e.preventDefault();

    try {
      // Map form fields to backend expected fields
      const leadData = {
        name: newStudent.name,
        father_name: newStudent.fatherName || null,
        phone: newStudent.phone,
        city: newStudent.city,
        source: newStudent.source,
        status: newStudent.status || 'Followup',
        neet: (newStudent.course === 'MBBS' || newStudent.course === 'BAMS/BDS')
          ? ([newStudent.neetPrevious, newStudent.neet2026].filter(Boolean).join(' | 2026: ') || null)
          : null,
        other_score: newStudent.course === 'Other' ? (newStudent.score || null) : null,
        course: newStudent.course || null,
        destination: newStudent.destination || null,
        remark: newStudent.remark || null,
      };

      const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      // If follow-up date is set, update lead with it after creation
      const result = await response.json();
      if (result.success && newStudent.nextFollowUpDate) {
        await fetch(`${API_URL}/leads/${result.data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ next_followup_date: newStudent.nextFollowUpDate })
        });
      }

      if (result.success) {
        alert('✓ Lead added successfully!');
        setAddModalOpen(false);
        setNewStudent({
          name: '',
          fatherName: '',
          phone: '',
          city: '',
          source: '',
          status: 'Followup',
          neetPrevious: '',
          neet2026: '',
          score: '',
          course: '',
          destination: '',
          nextFollowUpDate: '',
          remark: '',
        });
        fetchLeads(); // Refresh the leads list
      } else {
        alert('Failed to add student: ' + result.message);
      }
    } catch (err) {
      console.error('Error adding student:', err);
      alert('Error adding student. Check console for details.');
    }
  };

  // Bulk selection handlers - now uses filtered leads
  const handleSelectAll = (e, currentFilteredLeads) => {
    if (e.target.checked) {
      const filteredLeadIds = currentFilteredLeads.map(lead => lead.id);
      setSelectedLeads(filteredLeadIds);
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead');
      return;
    }
    setBulkAssignMode(true);
    setAssignModalOpen(true);
  };

  const handleBulkAssignSubmit = async () => {
    if (!selectedTelecaller) {
      alert('Please select a telecaller');
      return;
    }

    let assignedTo, assignedToName;
    if (selectedTelecaller === 'self') {
      if (!user) { alert('User not found'); return; }
      assignedTo = user.id;
      assignedToName = user.name;
    } else {
      const telecaller = telecallers.find(t => t.id === parseInt(selectedTelecaller));
      if (!telecaller) { alert('Telecaller not found'); return; }
      assignedTo = parseInt(selectedTelecaller);
      assignedToName = telecaller.name;
    }

    // Check for already assigned leads
    const alreadyAssigned = selectedLeads
      .map(id => leads.find(l => l.id === id))
      .filter(l => l && l.assigned_to_name && l.assigned_to_name !== 'Unassigned' && l.assigned_to !== assignedTo);

    if (alreadyAssigned.length > 0) {
      setConflictLeads(alreadyAssigned);
      setPendingAssign({ assignedTo, assignedToName });
      setConflictWarningOpen(true);
      return;
    }

    await doAssign(selectedLeads, assignedTo, assignedToName);
  };

  const doAssign = async (leadIds, assignedTo, assignedToName) => {
    try {
      const assignPromises = leadIds.map(leadId =>
        fetch(`${API_URL}/leads/${leadId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo, assignedToName })
        }).then(res => res.json())
      );
      const results = await Promise.all(assignPromises);
      const successCount = results.filter(r => r.success).length;
      alert(`${successCount} leads assigned to ${assignedToName} successfully!`);
      setAssignModalOpen(false);
      setSelectedTelecaller('');
      setSelectedLeads([]);
      setBulkAssignMode(false);
      setConflictWarningOpen(false);
      setConflictLeads([]);
      setPendingAssign(null);
      fetchLeads();
    } catch (err) {
      console.error('Error bulk assigning leads:', err);
      alert('Error assigning leads.');
    }
  };

  // Range selection handler
  const handleRangeSelect = () => {
    const from = parseInt(rangeFrom);
    const to = parseInt(rangeTo);

    if (isNaN(from) || isNaN(to)) {
      alert('Please enter valid numbers');
      return;
    }

    if (from < 1 || to < 1) {
      alert('Numbers must be greater than 0');
      return;
    }

    if (from > to) {
      alert('"From" must be less than or equal to "To"');
      return;
    }

    if (to > filteredLeads.length) {
      alert(`Maximum lead number is ${filteredLeads.length}`);
      return;
    }

    // Select leads from index (from-1) to (to-1) within currently filtered leads
    const rangeLeadIds = filteredLeads.slice(from - 1, to).map(lead => lead.id);
    setSelectedLeads(rangeLeadIds);
    setRangeModalOpen(false);
    setRangeFrom('');
    setRangeTo('');
  };

  // Calculate stats based on actual data
  const calculateStats = () => {
    const totalStudents = leads.length;
    const newLeads = leads.filter(l => l.status?.toLowerCase() === 'new').length;
    const latestDate = leads.reduce((max, l) => {
      if (!l.created_at) return max;
      const d = new Date(l.created_at).toDateString();
      return !max || new Date(d) > new Date(max) ? d : max;
    }, null);
    const recentLeads = latestDate ? leads.filter(l => l.created_at && new Date(l.created_at).toDateString() === latestDate).length : 0;
    const inProcess = leads.filter(l => {
      const status = l.status?.toLowerCase();
      return status === 'contacted' || status === 'interested' || status === 'call back';
    }).length;
    const enrolled = leads.filter(l => l.status?.toLowerCase() === 'converted').length;

    return [
      {
        title: 'Total Students',
        value: totalStudents.toString(),
        change: `${newLeads} new`,
        icon: Users,
        gradient: 'from-blue-500 to-blue-600',
        bg: 'bg-blue-50',
        iconColor: 'text-blue-600'
      },
      {
        title: 'New Inquiries',
        value: recentLeads.toString(),
        change: latestDate ? `Last added: ${latestDate}` : 'No leads yet',
        icon: Zap,
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-purple-50',
        iconColor: 'text-purple-600'
      },
      {
        title: 'In Process',
        value: inProcess.toString(),
        change: 'Active applications',
        icon: UserCheck,
        gradient: 'from-green-500 to-green-600',
        bg: 'bg-green-50',
        iconColor: 'text-green-600'
      },
      {
        title: 'Enrolled',
        value: enrolled.toString(),
        change: totalStudents > 0 ? `${((enrolled / totalStudents) * 100).toFixed(1)}% success` : '0% success',
        icon: GraduationCap,
        gradient: 'from-orange-500 to-orange-600',
        bg: 'bg-orange-50',
        iconColor: 'text-orange-600'
      },
    ];
  };

  const stats = calculateStats();

  // Calculate filtered leads (moved outside JSX for accessibility)
  const getFilteredLeads = () => {
    let filtered = [...leads];

    // Filter by active tab (status)
    if (activeTab !== 'all') {
      filtered = filtered.filter(lead => lead.status?.toLowerCase() === activeTab.toLowerCase());
    }

    // Filter by lead type (Raw/Qualified)
    if (leadTypeFilter && leadTypeFilter !== 'all') {
      filtered = filtered.filter(lead => {
        const leadIsRaw = isRawLead(lead);
        if (leadTypeFilter === 'raw') {
          return leadIsRaw;
        } else if (leadTypeFilter === 'qualified') {
          return !leadIsRaw;
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.city?.toLowerCase().includes(query) ||
        lead.source?.toLowerCase().includes(query) ||
        lead.assigned_to_name?.toLowerCase().includes(query)
      );
    }

    // Filter by status dropdown
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(lead =>
        lead.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by city
    if (cityFilter && cityFilter !== 'all') {
      filtered = filtered.filter(lead =>
        lead.city?.toLowerCase() === cityFilter.toLowerCase()
      );
    }

    // Filter by destination (course)
    if (destinationFilter && destinationFilter !== 'all') {
      filtered = filtered.filter(lead =>
        lead.course?.toLowerCase() === destinationFilter.toLowerCase()
      );
    }

    // Filter by course type (MBBS or Other)
    if (courseTypeFilter && courseTypeFilter !== 'all') {
      filtered = filtered.filter(lead =>
        lead.course?.toLowerCase() === courseTypeFilter.toLowerCase()
      );
    }

    // Filter by assigned to
    if (assignedFilter && assignedFilter !== 'all') {
      if (assignedFilter === 'Unassigned') {
        filtered = filtered.filter(lead =>
          !lead.assigned_to_name || lead.assigned_to_name === 'Unassigned'
        );
      } else {
        filtered = filtered.filter(lead =>
          lead.assigned_to_name?.toLowerCase() === assignedFilter.toLowerCase()
        );
      }
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
  }, [activeTab, leadTypeFilter, courseTypeFilter, statusFilter, cityFilter, assignedFilter, searchQuery]);

  const getStatusBadge = (status) => {
    // Normalize status to handle case variations
    const normalizedStatus = status ? status.toLowerCase() : 'followup';

    const styles = {
      followup: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        icon: '📋',
        text: 'Followup'
      },
      'after result': {
        bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
        icon: '📊',
        text: 'After Result'
      },
      'call back': {
        bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
        icon: '🔄',
        text: 'Call Back'
      },
      'office meeting': {
        bg: 'bg-gradient-to-r from-teal-500 to-teal-600',
        icon: '🏢',
        text: 'Office Meeting'
      },
      interested: {
        bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
        icon: '⭐',
        text: 'Interested'
      },
      'india first': {
        bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600',
        icon: '🇮🇳',
        text: 'India First'
      },
      'other course': {
        bg: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
        icon: '📚',
        text: 'Other Course'
      },
      'not interested': {
        bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
        icon: '✖',
        text: 'Not Interested'
      },
      drop: {
        bg: 'bg-gradient-to-r from-rose-500 to-rose-600',
        icon: '❌',
        text: 'Drop'
      },
      converted: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: '✓',
        text: 'Converted'
      },
    };

    const statusInfo = styles[normalizedStatus] || {
      bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
      icon: '?',
      text: status || 'Unknown'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-white shadow-sm ${statusInfo.bg}`}>
        <span className="text-[10px]">{statusInfo.icon}</span>
        {statusInfo.text}
      </span>
    );
  };

  const tabs = [
    { id: 'all', label: 'All Leads', count: leads.length },
    { id: 'followup', label: 'Followup', count: leads.filter(l => l.status?.toLowerCase() === 'followup').length },
    { id: 'after result', label: 'After Result', count: leads.filter(l => l.status?.toLowerCase() === 'after result').length },
    { id: 'call back', label: 'Call Back', count: leads.filter(l => l.status?.toLowerCase() === 'call back').length },
    { id: 'office meeting', label: 'Office Meeting', count: leads.filter(l => l.status?.toLowerCase() === 'office meeting').length },
    { id: 'interested', label: 'Interested', count: leads.filter(l => l.status?.toLowerCase() === 'interested').length },
    { id: 'india first', label: 'India First', count: leads.filter(l => l.status?.toLowerCase() === 'india first').length },
    { id: 'other course', label: 'Other Course', count: leads.filter(l => l.status?.toLowerCase() === 'other course').length },
    { id: 'not interested', label: 'Not Interested', count: leads.filter(l => l.status?.toLowerCase() === 'not interested').length },
    { id: 'drop', label: 'Drop', count: leads.filter(l => l.status?.toLowerCase() === 'drop').length },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-600 text-lg">Loading leads...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">{error}</p>
          <button
            onClick={fetchLeads}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if user has permission to add leads
  const canAddLeads = () => {
    if (!user) {
      console.log('❌ No user found');
      return false;
    }

    console.log('👤 Current user:', user);
    console.log('🔑 User permissions:', user.permissions);
    console.log('👔 User role:', user.role);

    // Super Admin and Manager can always add leads
    if (user.role === 'Super Admin' || user.role === 'Manager') {
      console.log('✅ User is Super Admin or Manager - can add leads');
      return true;
    }

    // Check if user has create_lead permission
    if (user.permissions && Array.isArray(user.permissions)) {
      const hasPermission = user.permissions.includes('create_lead');
      console.log('🔍 Has create_lead permission:', hasPermission);
      return hasPermission;
    }

    console.log('❌ No permissions found or not an array');
    return false;
  };

  const handleSaveCallLog = async () => {
    if (!callLogData.callOutcome || !callLogData.callRemark) {
      alert('Please select an Outcome and add a Remark');
      return;
    }
    try {
      setSavingCallLog(true);
      const response = await fetch(`${API_URL}/leads/${selectedLead.id}/call-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callRemark: callLogData.callRemark,
          callOutcome: callLogData.callOutcome,
          callReason: callLogData.callReason || null,
          nextFollowUpDate: callLogData.nextFollowUpDate || null,
          callerId: user.id,
          callerName: user.name,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Call log saved successfully!');
        setCallLogData({ callOutcome: '', callRemark: '', nextFollowUpDate: '', callReason: '' });
        setViewModalOpen(false);
        fetchLeads();
      } else {
        alert('Failed to save: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving call log:', err);
      alert('Failed to save call log. Please try again.');
    } finally {
      setSavingCallLog(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">Leads</h1>
            <p className="text-gray-500 text-xs md:text-sm">Manage all leads - raw and qualified students</p>
          </div>
          {canAddLeads() && (
            <button
              onClick={() => {
                console.log('Button clicked! Opening modal...');
                setAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-1 px-3 md:px-4 py-1.5 md:py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md text-xs md:text-sm"
            >
              <UserPlus size={18} />
              Add Lead
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border border-gray-100 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between mb-1 md:mb-2">
              <div className={`${stat.bg} p-1.5 md:p-2 rounded-lg`}>
                <stat.icon className={stat.iconColor} size={16} />
              </div>
            </div>
            <h3 className="text-gray-600 text-[10px] md:text-xs font-semibold mb-0.5">{stat.title}</h3>
            <p className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
            <p className="text-[10px] md:text-xs text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Assignment Summary Bar */}
      {(() => {
        const totalCount = leads.length;
        const assignedCount = leads.filter(l => l.assigned_to_name && l.assigned_to_name !== 'Unassigned').length;
        const unassignedCount = totalCount - assignedCount;
        const pct = totalCount > 0 ? Math.round((assignedCount / totalCount) * 100) : 0;
        return (
          <div className="bg-white rounded-lg md:rounded-xl shadow-md border border-gray-100 px-3 md:px-5 py-3 mb-4 flex flex-wrap items-center gap-3 md:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Total</span>
              <span className="text-sm font-bold text-gray-800">{totalCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
              <span className="text-xs font-semibold text-gray-500">Assigned</span>
              <span className="text-sm font-bold text-green-700">{assignedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span>
              <span className="text-xs font-semibold text-gray-500">Unassigned</span>
              <span className="text-sm font-bold text-red-600">{unassignedCount}</span>
            </div>
            <div className="flex-1 hidden sm:block">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{pct}% assigned</p>
            </div>
            {unassignedCount > 0 && (
              <button
                onClick={() => setAssignedFilter(assignedFilter === 'Unassigned' ? 'all' : 'Unassigned')}
                className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  assignedFilter === 'Unassigned'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                }`}
              >
                {assignedFilter === 'Unassigned' ? 'Show All' : `Show Unassigned (${unassignedCount})`}
              </button>
            )}
          </div>
        );
      })()}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-md p-2 md:p-4 border border-gray-100 mb-4">
        {/* Search Bar */}
        <div className="relative w-full mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, city, source, or assigned to..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-28 py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all text-xs md:text-sm"
          />
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCityFilter('all');
              setDestinationFilter('all');
              setAssignedFilter('all');
              setCourseTypeFilter('all');
              setLeadTypeFilter('all');
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-purple-600 hover:text-purple-700 font-semibold text-xs border border-purple-300 rounded hover:bg-purple-50 transition-all"
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {/* Lead Type Filter - Raw/Qualified/All */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Lead Type:</label>
            <select
              value={leadTypeFilter}
              onChange={(e) => setLeadTypeFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none transition-all text-xs md:text-sm font-medium bg-white"
            >
              <option value="all">All Leads</option>
              <option value="raw">Raw Leads</option>
              <option value="qualified">Qualified Leads</option>
            </select>
          </div>

          {/* Course Type Filter - for NEET/Score Label */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Course:</label>
            <select
              value={courseTypeFilter}
              onChange={(e) => setCourseTypeFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-purple-300 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all text-xs md:text-sm font-medium bg-white"
            >
              <option value="all">All Course</option>
              <option value="MBBS">MBBS</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] md:text-xs font-semibold text-gray-600 mb-1">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all text-xs md:text-sm font-medium bg-white"
            >
              <option value="all">All Statuses</option>
              {[...new Set(leads.map(lead => lead.status).filter(status => status))]
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
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all text-xs md:text-sm font-medium bg-white"
            >
              <option value="all">All Cities</option>
              {[...new Set(leads.map(lead => lead.city).filter(city => city))]
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
              className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none transition-all text-xs md:text-sm font-medium bg-white"
            >
              <option value="all">All Users</option>
              <option value="Unassigned">Unassigned</option>
              {[...new Set(leads.map(lead => lead.assigned_to_name).filter(name => name && name !== 'Unassigned'))]
                .sort()
                .map(name => (
                  <option key={name} value={name}>{name}</option>
                ))
              }
            </select>
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} <span className="ml-0.5 text-[10px] opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setRangeModalOpen(true)}
            className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 text-xs"
          >
            <Target size={16} />
            Select Range
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="mt-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                {selectedLeads.length}
              </div>
              <div>
                <p className="text-green-900 font-bold">
                  {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''} Selected
                </p>
                <p className="text-green-700 text-sm">Ready to assign to a telecaller</p>
              </div>
            </div>
            <button
              onClick={handleBulkAssign}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
            >
              <UserCheck size={20} />
              Assign to Telecaller
            </button>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-white/30 text-purple-600 bg-white/20 cursor-pointer"
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={(e) => handleSelectAll(e, filteredLeads)}
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Student Name</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Father's Name</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Mobile Number</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">{courseTypeFilter === 'Other' ? 'Score' : 'NEET Score'}</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Assigned To</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remarks</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-50">
                    {paginatedLeads.map((lead, index) => (
                <tr
                  key={lead.id}
                  ref={(el) => leadRefs.current[lead.id] = el}
                  className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 transition-all duration-200 hover:shadow-sm group ${
                    highlightId === lead.id
                      ? 'bg-yellow-100 ring-2 ring-yellow-400 animate-pulse'
                      : 'bg-white'
                  }`}
                >
                  <td className="px-2 py-1.5">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 cursor-pointer"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                    />
                  </td>
                  {/* Student Name */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
                        {lead.name.charAt(0)}
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
                  {/* NEET Score / Other Score */}
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
                    {getStatusBadge(lead.status)}
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
                  <td className="px-2 py-1.5 max-w-[160px]">
                    <div className="bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                      <div className="text-[10px] text-gray-700 truncate font-medium">
                        {lead.latest_call_remark || lead.remark || '-'}
                      </div>
                    </div>
                  </td>
                  {/* Action */}
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedLead(lead); setViewModalOpen(true); }}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 text-[10px] font-bold transition-all"
                      >
                        <Eye size={11} />
                        View
                      </button>
                      <button
                        onClick={() => { setAssignLeadId(lead.id); setAssignModalOpen(true); }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-md text-white text-[10px] font-bold transition-all"
                      >
                        <UserCheck size={11} />
                        Assign
                      </button>
                      {(user?.role === 'Super Admin' || user?.role === 'Manager') && (
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="flex items-center gap-1 px-2 py-1 bg-indigo-100 hover:bg-indigo-200 rounded-md text-indigo-700 text-[10px] font-bold transition-all"
                        >
                          <Edit2 size={11} />
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLeads.length > 0 ? (
          totalPages > 1 && (
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
          )
        ) : (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No leads found</h3>
            <p className="text-gray-500 mb-4">Import your first CSV file to get started!</p>
            <a
              href="/import"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
            >
              <Upload size={20} />
              Go to Import
            </a>
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {bulkAssignMode ? `Assign ${selectedLeads.length} Leads` : 'Assign Lead'}
                    </h2>
                    <p className="text-green-100 text-sm">
                      {bulkAssignMode
                        ? `Select a telecaller to assign ${selectedLeads.length} leads`
                        : 'Select a telecaller to assign this lead'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAssignModalOpen(false);
                    setSelectedTelecaller('');
                    setAssignLeadId(null);
                    setBulkAssignMode(false);
                    setSelectedLeads([]);
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Telecaller
                </label>
                <select
                  value={selectedTelecaller}
                  onChange={(e) => setSelectedTelecaller(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-sm font-medium bg-white"
                >
                  <option value="">-- Select Telecaller --</option>
                  <option value="self" className="font-semibold text-blue-600">
                    🔷 Self (Assign to me)
                  </option>
                  <option disabled>──────────</option>
                  {telecallers.map((telecaller) => (
                    <option key={telecaller.id} value={telecaller.id}>
                      {telecaller.name} ({telecaller.email})
                    </option>
                  ))}
                </select>
              </div>

              {telecallers.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <p className="text-yellow-800 text-sm font-medium">
                    No telecallers available. Please add telecallers first.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedTelecaller('');
                  setAssignLeadId(null);
                  setBulkAssignMode(false);
                  setSelectedLeads([]);
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={bulkAssignMode ? handleBulkAssignSubmit : handleAssignLead}
                disabled={!selectedTelecaller}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkAssignMode ? `Assign ${selectedLeads.length} Leads` : 'Assign Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Lead Modal */}
      {viewModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                  <span className="text-2xl font-bold">{selectedLead.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
                  <p className="text-purple-100">ID: #{1000 + selectedLead.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <UserCircle size={24} className="text-purple-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <UserCircle size={18} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{selectedLead.name}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Phone Number</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Phone size={18} className="text-blue-600" />
                      <span className="font-medium text-blue-900">{selectedLead.phone}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Mail size={18} className="text-gray-400" />
                      <span className="font-medium text-gray-900">{selectedLead.email || 'Not Provided'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">City</label>
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <MapPin size={18} className="text-emerald-600" />
                      <span className="font-medium text-emerald-900">{selectedLead.city}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">NEET Score</label>
                    <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Target size={18} className="text-purple-600" />
                      <span className="font-bold text-purple-900">{selectedLead.neet}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Source</label>
                    <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <TrendingUp size={18} className="text-cyan-600" />
                      <span className="font-medium text-cyan-900">{selectedLead.source}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap size={24} className="text-indigo-600" />
                  Course Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Course Interested In</label>
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <GraduationCap size={18} className="text-indigo-600" />
                      <span className="font-bold text-indigo-900">{selectedLead.course}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Destination Country</label>
                    <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <Globe size={18} className="text-orange-600" />
                      <span className="font-bold text-orange-900">{selectedLead.destination}</span>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Remarks / Notes</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-900">{selectedLead.remark}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Timeline */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={24} className="text-blue-600" />
                  Status & Timeline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Current Status</label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {getStatusBadge(selectedLead.status)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Assigned To</label>
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      !selectedLead.assigned_to_name || selectedLead.assigned_to_name === 'Unassigned'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-teal-50 border border-teal-200'
                    }`}>
                      <UserCircle size={18} className={!selectedLead.assigned_to_name || selectedLead.assigned_to_name === 'Unassigned' ? 'text-red-600' : 'text-teal-600'} />
                      <span className={`font-bold ${!selectedLead.assigned_to_name || selectedLead.assigned_to_name === 'Unassigned' ? 'text-red-900' : 'text-teal-900'}`}>
                        {selectedLead.assigned_to_name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Created Date</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Calendar size={18} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Last Contacted</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Clock size={18} className="text-gray-400" />
                      <span className="font-medium text-gray-900">Not contacted yet</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
              <button
                onClick={() => { setViewModalOpen(false); }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Warning Modal */}
      {conflictWarningOpen && pendingAssign && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-5 rounded-t-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Already Assigned Leads</h2>
                <p className="text-orange-100 text-xs">{conflictLeads.length} leads are already assigned to someone else</p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                {conflictLeads.map(l => (
                  <div key={l.id} className="flex items-center justify-between py-1 border-b border-orange-100 last:border-0">
                    <span className="text-sm font-semibold text-gray-800">{l.name}</span>
                    <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-medium">{l.assigned_to_name}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600">What do you want to do with these leads?</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => {
                    // Skip already assigned — only assign unassigned ones
                    const onlyUnassigned = selectedLeads.filter(id => {
                      const lead = leads.find(l => l.id === id);
                      return !lead?.assigned_to_name || lead.assigned_to_name === 'Unassigned' || lead.assigned_to === pendingAssign.assignedTo;
                    });
                    doAssign(onlyUnassigned, pendingAssign.assignedTo, pendingAssign.assignedToName);
                  }}
                  className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck size={16} />
                  Keep with previous telecaller — assign only new leads
                </button>
                <button
                  onClick={() => doAssign(selectedLeads, pendingAssign.assignedTo, pendingAssign.assignedToName)}
                  className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Assign all leads to {pendingAssign.assignedToName} (overwrite)
                </button>
                <button
                  onClick={() => { setConflictWarningOpen(false); setConflictLeads([]); setPendingAssign(null); }}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Range Selection Modal */}
      {rangeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Target size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Select Lead Range</h2>
                    <p className="text-blue-100 text-sm">Select leads from number X to Y (from current filtered view — {filteredLeads.length} leads)</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setRangeModalOpen(false);
                    setRangeFrom('');
                    setRangeTo('');
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  Total leads available: <span className="font-bold">{leads.length}</span>
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Example: Select from 1 to 40 will select first 40 leads
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    From Lead #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={leads.length}
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    To Lead #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={leads.length}
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    placeholder={leads.length.toString()}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>

              {rangeFrom && rangeTo && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-800 text-sm font-semibold">
                    Will select: {Math.max(0, parseInt(rangeTo || 0) - parseInt(rangeFrom || 0) + 1)} leads
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRangeModalOpen(false);
                  setRangeFrom('');
                  setRangeTo('');
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRangeSelect}
                disabled={!rangeFrom || !rangeTo}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select Range
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editModalOpen && editFormData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Edit Lead Details</h2>
                    <p className="text-indigo-100 text-sm">Update lead information</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditFormData(null);
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Father's Name</label>
                  <input
                    type="text"
                    value={editFormData.father_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, father_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="Father's full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Father Mobile Number</label>
                  <input
                    type="text"
                    value={editFormData.father_phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, father_phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="Father's mobile number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number *</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course</label>
                  <select
                    value={editFormData.course || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  >
                    <option value="">-- Select Course --</option>
                    <option value="MBBS">MBBS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {editFormData.course === 'MBBS' ? 'NEET Score' : 'Score'}
                  </label>
                  <input
                    type="text"
                    value={editFormData.neet || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, neet: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder={editFormData.course === 'MBBS' ? 'Enter NEET marks/rank' : 'Enter score'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Country</label>
                  <input
                    type="text"
                    value={editFormData.destination || editFormData.destination_country || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, destination: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="e.g. Russia, Kazakhstan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    value={editFormData.source || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="e.g. Google, Facebook, Referral"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    value={editFormData.assigned_to_name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, assigned_to_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="Telecaller name"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditFormData(null);
                }}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLead}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add {newLeadType === 'raw' ? 'Raw' : 'Qualified'} Lead</h2>
                    <p className="text-purple-100 text-sm">Name & Phone required, rest optional</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAddModalOpen(false);
                    setNewLeadType('raw');
                    setNewStudent({
                      name: '',
                      fatherName: '',
                      phone: '',
                      city: '',
                      source: '',
                      status: 'Followup',
                      neetPrevious: '',
                      neet2026: '',
                      course: '',
                      destination: '',
                      nextFollowUpDate: '',
                      remark: '',
                    });
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStudent} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                  {/* Common Fields for Both Raw and Qualified */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Student name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Father's Name</label>
                    <input
                      type="text"
                      value={newStudent.fatherName}
                      onChange={(e) => setNewStudent({...newStudent, fatherName: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Father's name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
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
                      value={newStudent.city}
                      onChange={(e) => setNewStudent({...newStudent, city: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                    <input
                      type="text"
                      value={newStudent.source}
                      onChange={(e) => setNewStudent({...newStudent, source: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="e.g. Google, Facebook, Referral"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={newStudent.status || 'Followup'}
                      onChange={(e) => setNewStudent({...newStudent, status: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    >
                      <option value="Followup">Followup</option>
                      <option value="After Result">After Result</option>
                      <option value="Call Back">Call Back</option>
                      <option value="Office Meeting">Office Meeting</option>
                      <option value="Interested">Interested</option>
                      <option value="India First">India First</option>
                      <option value="Other Course">Other Course</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="Drop">Drop</option>
                    </select>
                  </div>

                  {/* Qualified Lead Additional Fields */}
                  {newLeadType === 'qualified' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Father Name</label>
                        <input
                          type="text"
                          value={newStudent.fatherName}
                          onChange={(e) => setNewStudent({...newStudent, fatherName: e.target.value})}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                          placeholder="Father's name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Course Type</label>
                        <select
                          value={newStudent.course}
                          onChange={(e) => setNewStudent({...newStudent, course: e.target.value, neetPrevious: '', neet2026: '', score: ''})}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        >
                          <option value="">-- Select Course --</option>
                          <option value="MBBS">MBBS</option>
                          <option value="BAMS/BDS">BAMS / BDS</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {/* NEET fields — only for MBBS or BAMS/BDS */}
                      {(newStudent.course === 'MBBS' || newStudent.course === 'BAMS/BDS') && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">NEET Previous Year</label>
                            <input
                              type="text"
                              value={newStudent.neetPrevious}
                              onChange={(e) => setNewStudent({...newStudent, neetPrevious: e.target.value})}
                              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                              placeholder="Previous NEET score"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">NEET 2026</label>
                            <input
                              type="text"
                              value={newStudent.neet2026}
                              onChange={(e) => setNewStudent({...newStudent, neet2026: e.target.value})}
                              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                              placeholder="NEET 2026 score"
                            />
                          </div>
                        </>
                      )}
                      {/* Score field — only for Other course */}
                      {newStudent.course === 'Other' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Score</label>
                          <input
                            type="text"
                            value={newStudent.score || ''}
                            onChange={(e) => setNewStudent({...newStudent, score: e.target.value})}
                            className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                            placeholder="Enter exam score"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Interested Location</label>
                        <select
                          value={newStudent.destination}
                          onChange={(e) => setNewStudent({...newStudent, destination: e.target.value})}
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
                          value={newStudent.nextFollowUpDate}
                          onChange={(e) => setNewStudent({...newStudent, nextFollowUpDate: e.target.value})}
                          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Remark - Common for both */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Remark</label>
                    <textarea
                      value={newStudent.remark}
                      onChange={(e) => setNewStudent({...newStudent, remark: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Any additional notes..."
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setNewStudent({
                      name: '',
                      fatherName: '',
                      phone: '',
                      city: '',
                      source: '',
                      status: 'Followup',
                      neetPrevious: '',
                      neet2026: '',
                      course: '',
                      destination: '',
                      nextFollowUpDate: '',
                      remark: '',
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;