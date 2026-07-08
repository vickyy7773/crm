import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, User, Database, Save, CheckCircle, Download, Trash2, X, Filter } from 'lucide-react';

import API_URL from '../config/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [delStatusFilter, setDelStatusFilter] = useState('all');
  const [delAssignedFilter, setDelAssignedFilter] = useState('all');
  const [delCityFilter, setDelCityFilter] = useState('all');
  const [delTypeFilter, setDelTypeFilter] = useState('all');

  const [companySettings, setCompanySettings] = useState({
    companyName: 'Study Abroad Consultancy',
    email: 'contact@studyabroad.com',
    phone: '+91 9876543210',
    address: 'Udaipur, Rajasthan, India',
    website: 'www.studyabroad.com',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  });


  const [userSettings, setUserSettings] = useState({
    displayName: 'Admin User',
    email: 'admin@studyabroad.com',
    language: 'English',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h'
  });

  useEffect(() => {
    if (activeTab === 'data') {
      fetchLeads();
    } else if (activeTab === 'company') {
      fetchCompanySettings();
    }
  }, [activeTab]);

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/company`);
      const data = await response.json();
      if (data.success) {
        setCompanySettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const response = await fetch(`${API_URL}/leads`);
      const data = await response.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (activeTab === 'company') {
        const response = await fetch(`${API_URL}/settings/company`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(companySettings)
        });
        const data = await response.json();

        if (data.success) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
          alert('Company settings saved successfully!');
        } else {
          alert('Failed to save settings: ' + (data.message || 'Unknown error'));
        }
      } else if (activeTab === 'profile') {
        // For user settings, we'll save without user ID for now
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        alert('Profile settings will be implemented in future update!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/export/leads-csv`);

      if (!response.ok) {
        throw new Error('Failed to export CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('CSV export successful!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseBackup = async () => {
    if (!confirm('Create a database backup? This may take a few moments.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/export/database-backup`);

      if (!response.ok) {
        throw new Error('Failed to create backup');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm_backup_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Database backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLeadSelection = (id) => {
    setSelectedLeadIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const handleDeleteLead = async () => {
    if (selectedLeadIds.length === 0) {
      alert('Please select at least one lead to delete');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${selectedLeadIds.length} lead(s)? This action cannot be undone!`)) {
      return;
    }

    try {
      setLoading(true);
      let successCount = 0;
      for (const id of selectedLeadIds) {
        const response = await fetch(`${API_URL}/leads/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) successCount++;
      }
      alert(`${successCount} lead(s) deleted successfully!`);
      setDeleteModalOpen(false);
      setSelectedLeadIds([]);
      setSearchTerm('');
      fetchLeads();
    } catch (error) {
      console.error('Error deleting leads:', error);
      alert('Failed to delete leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isRaw = (lead) => !lead.neet && !lead.course && !lead.destination;

  const filteredLeads = leads.filter(lead => {
    if (delStatusFilter !== 'all' && lead.status !== delStatusFilter) return false;
    if (delAssignedFilter === 'unassigned' && lead.assigned_to_name) return false;
    if (delAssignedFilter !== 'all' && delAssignedFilter !== 'unassigned' && lead.assigned_to_name !== delAssignedFilter) return false;
    if (delCityFilter !== 'all' && lead.city !== delCityFilter) return false;
    if (delTypeFilter === 'raw' && !isRaw(lead)) return false;
    if (delTypeFilter === 'qualified' && isRaw(lead)) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return lead.name?.toLowerCase().includes(q) || lead.phone?.includes(q) || lead.city?.toLowerCase().includes(q);
    }
    return true;
  });

  const resetDeleteFilters = () => {
    setDelStatusFilter('all');
    setDelAssignedFilter('all');
    setDelCityFilter('all');
    setDelTypeFilter('all');
    setSearchTerm('');
    setSelectedLeadIds([]);
  };

  const uniqueStatuses = [...new Set(leads.map(l => l.status).filter(Boolean))].sort();
  const uniqueCities = [...new Set(leads.map(l => l.city).filter(Boolean))].sort();
  const uniqueAssigned = [...new Set(leads.map(l => l.assigned_to_name).filter(Boolean))].sort();

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'data', label: 'Data', icon: Database }
  ];

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Settings</h1>
        <p className="text-gray-600 text-sm md:text-lg">Manage your CRM application settings</p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600" size={24} />
          <p className="font-semibold text-green-800">Settings saved successfully!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={20} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            {/* Company Settings */}
            {activeTab === 'company' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Website</label>
                      <input
                        type="text"
                        value={companySettings.website}
                        onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                    <textarea
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Timezone</label>
                      <select
                        value={companySettings.timezone}
                        onChange={(e) => setCompanySettings({...companySettings, timezone: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
                      <select
                        value={companySettings.currency}
                        onChange={(e) => setCompanySettings({...companySettings, currency: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        value={userSettings.displayName}
                        onChange={(e) => setUserSettings({...userSettings, displayName: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings({...userSettings, email: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
                      <select
                        value={userSettings.language}
                        onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Date Format</label>
                      <select
                        value={userSettings.dateFormat}
                        onChange={(e) => setUserSettings({...userSettings, dateFormat: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Time Format</label>
                      <select
                        value={userSettings.timeFormat}
                        onChange={(e) => setUserSettings({...userSettings, timeFormat: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
                      >
                        <option value="12h">12 Hour</option>
                        <option value="24h">24 Hour</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeTab === 'data' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Management</h2>
                <div className="space-y-6">
                  <div className="p-6 bg-green-50 border border-green-200 rounded-xl">
                    <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
                      <Download size={20} />
                      Export Leads Data
                    </h3>
                    <p className="text-sm text-green-700 mb-4">Download all leads data in CSV format for analysis or backup</p>
                    <button
                      onClick={handleExportCSV}
                      disabled={loading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Download size={18} />
                      {loading ? 'Exporting...' : 'Export as CSV'}
                    </button>
                  </div>

                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-xl">
                    <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
                      <Database size={20} />
                      Database Backup
                    </h3>
                    <p className="text-sm text-orange-700 mb-4">Create a complete SQL backup of your entire database (MySQL dump)</p>
                    <button
                      onClick={handleDatabaseBackup}
                      disabled={loading}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Database size={18} />
                      {loading ? 'Creating Backup...' : 'Create Backup'}
                    </button>
                  </div>

                  <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                    <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                      <Trash2 size={20} />
                      Delete Lead
                    </h3>
                    <p className="text-sm text-red-700 mb-4">Permanently delete a specific lead from the system. This action cannot be undone!</p>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                    >
                      <Trash2 size={18} />
                      Delete Lead
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Save size={20} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Lead Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 size={28} />
                <div>
                  <h2 className="text-2xl font-bold">Delete Leads</h2>
                  {selectedLeadIds.length > 0 && (
                    <p className="text-red-100 text-sm">{selectedLeadIds.length} lead(s) selected</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedLeadIds([]);
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Trash2 className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-red-700 text-xs font-medium">Permanent action — deleted leads cannot be recovered!</p>
              </div>

              {/* Quick Presets */}
              <div>
                <p className="text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1"><Filter size={11}/> Quick Select</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Not Interested', 'Drop', 'Invalid Lead'].map(status => (
                    <button key={status} onClick={() => { setDelStatusFilter(status); setSelectedLeadIds([]); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${delStatusFilter === status ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-300 hover:bg-red-50'}`}>
                      {status} ({leads.filter(l => l.status === status).length})
                    </button>
                  ))}
                  <button onClick={() => { setDelAssignedFilter('unassigned'); setSelectedLeadIds([]); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${delAssignedFilter === 'unassigned' ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                    Unassigned ({leads.filter(l => !l.assigned_to_name).length})
                  </button>
                  <button onClick={resetDeleteFilters}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
                    Clear
                  </button>
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <select value={delStatusFilter} onChange={e => { setDelStatusFilter(e.target.value); setSelectedLeadIds([]); }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white outline-none focus:border-red-400">
                  <option value="all">All Statuses</option>
                  {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={delAssignedFilter} onChange={e => { setDelAssignedFilter(e.target.value); setSelectedLeadIds([]); }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white outline-none focus:border-red-400">
                  <option value="all">All Users</option>
                  <option value="unassigned">Unassigned</option>
                  {uniqueAssigned.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={delCityFilter} onChange={e => { setDelCityFilter(e.target.value); setSelectedLeadIds([]); }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white outline-none focus:border-red-400">
                  <option value="all">All Cities</option>
                  {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={delTypeFilter} onChange={e => { setDelTypeFilter(e.target.value); setSelectedLeadIds([]); }}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium bg-white outline-none focus:border-red-400">
                  <option value="all">All Types</option>
                  <option value="raw">Raw Only</option>
                  <option value="qualified">Qualified Only</option>
                </select>
              </div>

              {/* Search */}
              <input type="text" placeholder="Search by name, phone, city..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setSelectedLeadIds([]); }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-red-400"
              />

              {/* Select All + Count */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox"
                    checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-red-600"
                  />
                  <span className="text-sm font-semibold text-gray-700">Select All ({filteredLeads.length} leads)</span>
                </label>
                {selectedLeadIds.length > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                    {selectedLeadIds.length} selected
                  </span>
                )}
              </div>

              {/* Lead List */}
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[30vh] overflow-y-auto">
                {filteredLeads.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">No leads found</div>
                ) : (
                  filteredLeads.map((lead, idx) => (
                    <label key={lead.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all ${
                        selectedLeadIds.includes(lead.id) ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50'
                      } ${idx !== 0 ? 'border-t border-gray-100' : ''}`}
                    >
                      <input type="checkbox" checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="w-4 h-4 accent-red-600 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{lead.name}</p>
                        <p className="text-xs text-gray-500 truncate">{lead.phone} · {lead.city || '—'} · {lead.status}</p>
                      </div>
                      {lead.assigned_to_name ? (
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                          {lead.assigned_to_name}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                          Unassigned
                        </span>
                      )}
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedLeadIds([]);
                  setSearchTerm('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={selectedLeadIds.length === 0 || loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={18} />
                {loading ? 'Deleting...' : `Delete ${selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : ''} Lead(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
