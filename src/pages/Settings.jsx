import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Building2, User, Database, Save, CheckCircle, Download, Trash2, X } from 'lucide-react';

import API_URL from '../config/api';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleDeleteLead = async () => {
    if (!selectedLeadId) {
      alert('Please select a lead to delete');
      return;
    }

    const selectedLead = leads.find(l => l.id === parseInt(selectedLeadId));
    if (!selectedLead) {
      alert('Lead not found');
      return;
    }

    if (!confirm(`Are you sure you want to delete lead "${selectedLead.name}" (${selectedLead.phone})? This action cannot be undone!`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/leads/${selectedLeadId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Lead deleted successfully!');
        setDeleteModalOpen(false);
        setSelectedLeadId('');
        setSearchTerm('');
        fetchLeads(); // Refresh the list
      } else {
        alert('Failed to delete lead: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <h2 className="text-2xl font-bold">Delete Lead</h2>
              </div>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedLeadId('');
                  setSearchTerm('');
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <Trash2 className="text-red-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-red-900 font-semibold">Warning: Permanent Action</p>
                  <p className="text-red-700 text-sm">
                    Deleting a lead will permanently remove it from the database. This action cannot be undone!
                  </p>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search leads by name, phone, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                />
              </div>

              {/* Lead Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Lead to Delete ({filteredLeads.length} leads)
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                >
                  <option value="">-- Select a lead --</option>
                  {filteredLeads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} - {lead.phone} - {lead.city || 'No city'} - {lead.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Lead Preview */}
              {selectedLeadId && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Selected Lead Details:</p>
                  {(() => {
                    const lead = leads.find(l => l.id === parseInt(selectedLeadId));
                    return lead ? (
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>Name:</strong> {lead.name}</p>
                        <p><strong>Phone:</strong> {lead.phone}</p>
                        <p><strong>City:</strong> {lead.city || 'N/A'}</p>
                        <p><strong>Destination:</strong> {lead.destination || 'N/A'}</p>
                        <p><strong>Status:</strong> {lead.status}</p>
                        <p><strong>Assigned To:</strong> {lead.assigned_to_name || 'Unassigned'}</p>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedLeadId('');
                  setSearchTerm('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={!selectedLeadId || loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={18} />
                {loading ? 'Deleting...' : 'Delete Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
