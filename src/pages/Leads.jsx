import { useState, useEffect } from 'react';
import API_URL from '../config/api';
import {
  Users, Zap, Target, UserCheck, Search, Filter,
  MoreVertical, Phone, Mail, Eye, GraduationCap,
  UserPlus, TrendingUp, Clock, MapPin, Globe, UserCircle, Loader, Upload,
  X, Edit2, Calendar, Plus
} from 'lucide-react';

const Leads = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [courseTypeFilter, setCourseTypeFilter] = useState('all');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    phone: '',
    neet: '',
    city: '',
    country: '',
    course: '',
    remark: '',
    source: '',
    status: 'New'
  });

  // Fetch leads from API
  useEffect(() => {
    fetchLeads();
    fetchTelecallers();
  }, []);

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
        // Filter to show ALL QUALIFIED leads (whether assigned or not)
        // Exclude converted leads (they appear in Converted Leads page)
        // Exclude raw leads (they appear in Raw Leads page)
        const qualifiedLeads = result.data.filter(lead =>
          lead.status !== 'Converted' &&
          !isRawLead(lead) // Only show qualified leads (has NEET, Course, Destination)
        );
        setLeads(qualifiedLeads);
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
      // Find the selected telecaller's name
      const telecaller = telecallers.find(t => t.id === parseInt(selectedTelecaller));
      if (!telecaller) {
        alert('Telecaller not found');
        return;
      }

      const response = await fetch(`${API_URL}/leads/${assignLeadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo: parseInt(selectedTelecaller),
          assignedToName: telecaller.name
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
      const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });

      const result = await response.json();
      if (result.success) {
        alert('✓ Student added successfully!');
        setAddModalOpen(false);
        setNewStudent({
          name: '',
          phone: '',
          neet: '',
          city: '',
          country: '',
          course: '',
          remark: '',
          source: '',
          status: 'New'
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

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allLeadIds = leads.map(lead => lead.id);
      setSelectedLeads(allLeadIds);
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

    const telecaller = telecallers.find(t => t.id === parseInt(selectedTelecaller));
    if (!telecaller) {
      alert('Telecaller not found');
      return;
    }

    try {
      // Assign all selected leads
      const assignPromises = selectedLeads.map(leadId =>
        fetch(`${API_URL}/${leadId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignedTo: parseInt(selectedTelecaller),
            assignedToName: telecaller.name
          })
        }).then(res => res.json())
      );

      const results = await Promise.all(assignPromises);
      const successCount = results.filter(r => r.success).length;

      alert(`${successCount} out of ${selectedLeads.length} leads assigned successfully!`);
      setAssignModalOpen(false);
      setSelectedTelecaller('');
      setSelectedLeads([]);
      setBulkAssignMode(false);
      fetchLeads();
    } catch (err) {
      console.error('Error bulk assigning leads:', err);
      alert('Error assigning leads. Check console for details.');
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

    if (to > leads.length) {
      alert(`Maximum lead number is ${leads.length}`);
      return;
    }

    // Select leads from index (from-1) to (to-1)
    const rangeLeadIds = leads.slice(from - 1, to).map(lead => lead.id);
    setSelectedLeads(rangeLeadIds);
    setRangeModalOpen(false);
    setRangeFrom('');
    setRangeTo('');
  };

  // Calculate stats based on actual data
  const calculateStats = () => {
    const totalStudents = leads.length;
    const newLeads = leads.filter(l => l.status?.toLowerCase() === 'new').length;
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
        value: newLeads.toString(),
        change: 'Unassigned',
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

  const getStatusBadge = (status) => {
    // Normalize status to handle case variations
    const normalizedStatus = status ? status.toLowerCase() : 'new';

    const styles = {
      new: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        icon: '🆕',
        text: 'New'
      },
      contacted: {
        bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        icon: '📞',
        text: 'Contacted'
      },
      interested: {
        bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
        icon: '⭐',
        text: 'Interested'
      },
      'call back': {
        bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
        icon: '🔄',
        text: 'Call Back'
      },
      'not interested': {
        bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
        icon: '✖',
        text: 'Not Interested'
      },
      'wrong number': {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        icon: '📵',
        text: 'Wrong Number'
      },
      converted: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: '✓',
        text: 'Converted'
      },
      // Legacy status support
      qualified: {
        bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
        icon: '✨',
        text: 'Qualified'
      },
      enrolled: {
        bg: 'bg-gradient-to-r from-green-500 to-emerald-500',
        icon: '✓',
        text: 'Enrolled'
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
    { id: 'new', label: 'New', count: leads.filter(l => l.status?.toLowerCase() === 'new').length },
    { id: 'contacted', label: 'Contacted', count: leads.filter(l => l.status?.toLowerCase() === 'contacted').length },
    { id: 'interested', label: 'Interested', count: leads.filter(l => l.status?.toLowerCase() === 'interested').length },
    { id: 'converted', label: 'Converted', count: leads.filter(l => l.status?.toLowerCase() === 'converted').length },
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

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Qualified Leads</h1>
            <p className="text-gray-600 text-lg">Manage qualified students interested in studying abroad</p>
          </div>
          <button
            onClick={() => {
              console.log('Button clicked! Opening modal...');
              setAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <UserPlus size={20} />
            Add Qualified Lead
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bg} p-4 rounded-xl`}>
                <stat.icon className={stat.iconColor} size={28} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-semibold mb-1">{stat.title}</h3>
            <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-6">
        {/* Search Bar */}
        <div className="relative w-full mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, phone, city, source, or assigned to..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-40 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm"
          />
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setCityFilter('all');
              setDestinationFilter('all');
              setAssignedFilter('all');
              setCourseTypeFilter('MBBS');
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 text-purple-600 hover:text-purple-700 font-semibold text-sm border-2 border-purple-300 rounded-lg hover:bg-purple-50 transition-all"
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Course Type Filter - for NEET/Score Label */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">View As:</label>
            <select
              value={courseTypeFilter}
              onChange={(e) => setCourseTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Leads</option>
              <option value="MBBS">MBBS (NEET)</option>
              <option value="Other">Other (Score)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
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
            <label className="block text-xs font-bold text-gray-700 mb-2">City:</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
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

          {/* Course Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Course:</label>
            <select
              value={destinationFilter}
              onChange={(e) => setDestinationFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
            >
              <option value="all">All Courses</option>
              {[...new Set(leads.map(lead => lead.course).filter(course => course))]
                .sort()
                .map(course => (
                  <option key={course} value={course}>{course}</option>
                ))
              }
            </select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Assigned To:</label>
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm font-medium bg-white"
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
        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} <span className="ml-2 text-sm opacity-80">({tab.count})</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setRangeModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-2 shadow-sm"
          >
            <Target size={18} />
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

      {/* Apply Filters */}
      {(() => {
        let filteredLeads = [...leads];

        // Filter by active tab (status)
        if (activeTab !== 'all') {
          const tabStatus = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
          filteredLeads = filteredLeads.filter(lead => lead.status === tabStatus);
        }

        // Filter by search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredLeads = filteredLeads.filter(lead =>
            lead.name?.toLowerCase().includes(query) ||
            lead.phone?.includes(query) ||
            lead.city?.toLowerCase().includes(query) ||
            lead.source?.toLowerCase().includes(query) ||
            lead.assigned_to_name?.toLowerCase().includes(query)
          );
        }

        // Filter by status dropdown
        if (statusFilter && statusFilter !== 'all') {
          filteredLeads = filteredLeads.filter(lead =>
            lead.status?.toLowerCase() === statusFilter.toLowerCase()
          );
        }

        // Filter by city (case-insensitive)
        if (cityFilter && cityFilter !== 'all') {
          filteredLeads = filteredLeads.filter(lead =>
            lead.city?.toLowerCase() === cityFilter.toLowerCase()
          );
        }

        // Filter by destination (course) (case-insensitive)
        if (destinationFilter && destinationFilter !== 'all') {
          filteredLeads = filteredLeads.filter(lead =>
            lead.course?.toLowerCase() === destinationFilter.toLowerCase()
          );
        }

        // Filter by course type (MBBS or Other)
        if (courseTypeFilter && courseTypeFilter !== 'all') {
          filteredLeads = filteredLeads.filter(lead =>
            lead.course?.toLowerCase() === courseTypeFilter.toLowerCase()
          );
        }

        // Filter by assigned to (case-insensitive)
        if (assignedFilter && assignedFilter !== 'all') {
          if (assignedFilter === 'Unassigned') {
            filteredLeads = filteredLeads.filter(lead =>
              !lead.assigned_to_name || lead.assigned_to_name === 'Unassigned'
            );
          } else {
            filteredLeads = filteredLeads.filter(lead =>
              lead.assigned_to_name?.toLowerCase() === assignedFilter.toLowerCase()
            );
          }
        }

        return (
          <>
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
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Phone</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">{courseTypeFilter === 'Other' ? 'Score' : 'NEET'}</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Course</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remark</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Source</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Assigned</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-50">
                    {filteredLeads.map((lead, index) => (
                <tr key={lead.id} className="bg-white border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 transition-all duration-200 hover:shadow-sm group">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-gray-300 text-purple-600 cursor-pointer"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                    />
                  </td>
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
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 w-fit">
                      <Phone size={11} className="text-blue-600" />
                      <span className="text-[10px] font-semibold text-blue-700 truncate max-w-[100px]">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                      <Target size={11} />
                      {lead.neet}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                      <MapPin size={11} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-emerald-700">{lead.city}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200 w-fit">
                        <GraduationCap size={11} className="text-indigo-600" />
                        <span className="font-bold text-indigo-700 text-xs">{lead.course}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-orange-50 px-1.5 py-0.5 rounded w-fit">
                        <Globe size={9} className="text-orange-600" />
                        <span className="text-[10px] font-medium text-orange-700">{lead.destination}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <div className="bg-gray-50 px-2 py-1.5 rounded-md border border-gray-200">
                      <div className="text-[10px] text-gray-700 truncate font-medium">
                        {lead.remark}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-gray-500 mt-0.5">
                        <Clock size={9} />
                        {lead.importedDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="inline-block bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200">
                      <div className="text-[10px] font-bold text-cyan-700">{lead.source}</div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-semibold text-[10px] ${
                      !lead.assigned_to_name || lead.assigned_to_name === 'Unassigned'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-teal-50 text-teal-700 border border-teal-200'
                    }`}>
                      <UserCircle size={11} />
                      {lead.assigned_to_name || 'Unassigned'}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setViewModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-md transition-all text-gray-700 text-[10px] font-bold shadow-sm hover:shadow transform hover:scale-105"
                      >
                        <Eye size={11} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setAssignLeadId(lead.id);
                          setAssignModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-md transition-all text-white text-[10px] font-bold shadow-sm hover:shadow transform hover:scale-105"
                      >
                        <UserCheck size={11} />
                        Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredLeads.length > 0 ? (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">1-{Math.min(filteredLeads.length, 10)}</span> of <span className="font-semibold">{filteredLeads.length}</span> qualified leads
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                Previous
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold">
                1
              </button>
              <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No qualified leads yet</h3>
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
          </>
        );
      })()}

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

              {/* Actions */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleEditLead(selectedLead)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
                  >
                    <Edit2 size={18} />
                    Edit Details
                  </button>
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow"
                  >
                    <X size={18} />
                    Delete Lead
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
              >
                Close
              </button>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow">
                Save Changes
              </button>
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
                    <p className="text-blue-100 text-sm">Select leads from number X to Y</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Country</label>
                  <input
                    type="text"
                    value={editFormData.destination_country || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, destination_country: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Course Interested</label>
                  <input
                    type="text"
                    value={editFormData.course_interested || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, course_interested: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    value={editFormData.source || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={editFormData.status || 'New'}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  placeholder="Add any notes..."
                ></textarea>
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
                    <h2 className="text-2xl font-bold">Add Qualified Lead</h2>
                    <p className="text-purple-100 text-sm">Add a new qualified lead to the system</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setAddModalOpen(false);
                    setNewStudent({
                      name: '',
                      phone: '',
                      neet: '',
                      city: '',
                      course: '',
                      remark: '',
                      source: '',
                      status: 'New'
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

              {/* Qualified Lead Details */}
              <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                <h3 className="text-md font-bold text-purple-900 mb-3">📝 Qualified Lead Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Enter student's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                      maxLength="10"
                      minLength="10"
                      pattern="[0-9]{10}"
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">NEET Score</label>
                    <input
                      type="text"
                      value={newStudent.neet}
                      onChange={(e) => setNewStudent({...newStudent, neet: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="NEET marks/rank"
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={newStudent.country}
                      onChange={(e) => setNewStudent({...newStudent, country: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="e.g. India, USA, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Course *</label>
                    <select
                      value={newStudent.course}
                      onChange={(e) => setNewStudent({...newStudent, course: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    >
                      <option value="MBBS">MBBS</option>
                      <option value="Other">Other</option>
                    </select>
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
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status *</label>
                    <select
                      value={newStudent.status}
                      onChange={(e) => setNewStudent({...newStudent, status: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Follow-up">Follow-up</option>
                      <option value="Not Interested">Not Interested</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Remark</label>
                    <textarea
                      value={newStudent.remark}
                      onChange={(e) => setNewStudent({...newStudent, remark: e.target.value})}
                      className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                      placeholder="Any additional notes or remarks..."
                      rows="3"
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
                      phone: '',
                      neet: '',
                      city: '',
                      course: '',
                      remark: '',
                      source: '',
                      status: 'New'
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
                  Add Qualified Lead
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