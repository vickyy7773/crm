import { useState, useEffect } from 'react';
import { UserCheck, Phone, User, RefreshCw, CheckCircle, Target, MapPin, GraduationCap, Globe, Clock, MessageSquare, X, Calendar } from 'lucide-react';
import API_URL from '../config/api';

const AssignedLeads = () => {
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState('all'); // 'all', 'raw', 'qualified'
  const [remarkModal, setRemarkModal] = useState(false);
  const [selectedRemark, setSelectedRemark] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchAssignedLeads();
  }, []);

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

  // Filter leads based on active tab and lead type filter
  const getFilteredLeads = () => {
    let filtered = assignedLeads;

    // First filter by lead type (raw/qualified)
    if (leadTypeFilter === 'raw') {
      filtered = filtered.filter(lead => isRawLead(lead));
    } else if (leadTypeFilter === 'qualified') {
      filtered = filtered.filter(lead => !isRawLead(lead));
    }

    // Then filter by status tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(lead => lead.status === activeTab);
    }

    return filtered;
  };

  const filteredLeads = getFilteredLeads();

  // Calculate raw and qualified counts
  const rawCount = assignedLeads.filter(lead => isRawLead(lead)).length;
  const qualifiedCount = assignedLeads.filter(lead => !isRawLead(lead)).length;

  // Calculate counts for tabs (Converted leads removed - see Converted Leads page)
  const counts = {
    all: assignedLeads.length,
    New: assignedLeads.filter(l => l.status === 'New').length,
    Contacted: assignedLeads.filter(l => l.status === 'Contacted').length,
    Interested: assignedLeads.filter(l => l.status === 'Interested').length,
    'Call Back': assignedLeads.filter(l => l.status === 'Call Back').length,
    'Not Interested': assignedLeads.filter(l => l.status === 'Not Interested').length,
    'Not Reachable': assignedLeads.filter(l => l.status === 'Not Reachable').length,
    'Office Visit': assignedLeads.filter(l => l.status === 'Office Visit').length,
    'Drop': assignedLeads.filter(l => l.status === 'Drop').length,
  };

  const tabs = [
    { id: 'all', label: 'All Assigned', count: counts.all },
    { id: 'New', label: 'New', count: counts.New },
    { id: 'Contacted', label: 'Contacted', count: counts.Contacted },
    { id: 'Interested', label: 'Interested', count: counts.Interested },
    { id: 'Call Back', label: 'Call Back', count: counts['Call Back'] },
    { id: 'Not Interested', label: 'Not Interested', count: counts['Not Interested'] },
    { id: 'Not Reachable', label: 'Not Reachable', count: counts['Not Reachable'] },
    { id: 'Office Visit', label: 'Office Visit', count: counts['Office Visit'] },
    { id: 'Drop', label: 'Drop', count: counts['Drop'] },
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
      'New': 'bg-blue-100 text-blue-800 border-blue-300',
      'Contacted': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Interested': 'bg-purple-100 text-purple-800 border-purple-300',
      'Converted': 'bg-green-100 text-green-800 border-green-300',
      'Not Interested': 'bg-gray-100 text-gray-800 border-gray-300',
      'Call Back': 'bg-orange-100 text-orange-800 border-orange-300',
      'Not Reachable': 'bg-red-100 text-red-800 border-red-300',
      'Office Visit': 'bg-teal-100 text-teal-800 border-teal-300',
      'Drop': 'bg-rose-100 text-rose-800 border-rose-300',
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
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Assigned Leads</h1>
            <p className="text-gray-600 text-lg">Track all leads assigned to telecallers</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Lead Type Dropdown Filter */}
            <div className="relative">
              <select
                value={leadTypeFilter}
                onChange={(e) => setLeadTypeFilter(e.target.value)}
                className="appearance-none bg-white border-2 border-purple-300 rounded-xl px-5 py-3 pr-10 font-bold text-gray-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 shadow-md cursor-pointer"
              >
                <option value="all">All Leads ({assignedLeads.length})</option>
                <option value="raw">Raw Leads ({rawCount})</option>
                <option value="qualified">Qualified Leads ({qualifiedCount})</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <button
              onClick={fetchAssignedLeads}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Total Assigned</p>
              <p className="text-4xl font-bold text-gray-900">{counts.all}</p>
            </div>
            <UserCheck className="text-blue-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Raw Leads</p>
              <p className="text-4xl font-bold text-gray-900">{rawCount}</p>
            </div>
            <Target className="text-orange-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Qualified Leads</p>
              <p className="text-4xl font-bold text-gray-900">{qualifiedCount}</p>
            </div>
            <CheckCircle className="text-green-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Interested</p>
              <p className="text-4xl font-bold text-gray-900">{counts.Interested}</p>
            </div>
            <UserCheck className="text-purple-500" size={40} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label} <span className="ml-2 text-sm opacity-80">({tab.count})</span>
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Phone</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">NEET</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">City</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Course</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Remark</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Source</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Assigned</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="bg-white border-b border-gray-100 hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 transition-all duration-200 hover:shadow-sm group"
                  >
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
                        {lead.neet || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                        <MapPin size={11} className="text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">{lead.city || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-200 w-fit">
                        <GraduationCap size={11} className="text-indigo-600" />
                        <span className="font-bold text-indigo-700 text-xs">{lead.course || '-'}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px]">
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
                        {lead.latest_call_remark && (
                          <div className="text-[8px] text-purple-500 mt-0.5">
                            Click to view full remark
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="inline-block bg-cyan-50 px-2 py-1 rounded-md border border-cyan-200">
                        <div className="text-[10px] font-bold text-cyan-700">{lead.source || '-'}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          <User size={12} />
                        </div>
                        <span className="text-[10px] font-bold text-green-700">{lead.assigned_to_name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default AssignedLeads;
