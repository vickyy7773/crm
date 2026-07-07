import { useState, useEffect } from 'react';
import { Phone, MapPin, X, Save, User, GraduationCap, Globe, FileText, MessageSquare, Tag, PhoneOff, PhoneCall, Clock, Edit2, Target } from 'lucide-react';
import API_URL from '../../config/api';

const TelecallerRawLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [callStatusModal, setCallStatusModal] = useState(false);
  const [callStatusLead, setCallStatusLead] = useState(null);
  const [callRemark, setCallRemark] = useState('');

  // City edit states
  const [cityEditModal, setCityEditModal] = useState(false);
  const [cityEditLead, setCityEditLead] = useState(null);
  const [cityValue, setCityValue] = useState('');

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Qualification form data
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    neet: '',
    course: 'MBBS',
    destination: '',
    fatherName: '',
    fatherPhone: '',
    email: '',
    remark: '',
    source: ''
  });

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

  // Fetch raw leads assigned to this telecaller
  useEffect(() => {
    fetchRawLeads();
  }, []);

  const fetchRawLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/leads`);
      const result = await response.json();

      if (result.success) {
        // Filter raw leads assigned to THIS telecaller only
        // Raw = leads without qualification fields (NEET, Course, Destination)
        // Note: Remark and Source are NOT qualification fields - leads can have remarks from call status updates
        const rawLeads = result.data.filter(lead => {
          const isEmpty = (field) => {
            return !field || field === null || field === undefined || field.toString().trim() === '';
          };

          // Only show leads assigned to this telecaller that are still raw (not qualified)
          // A lead is "raw" if it doesn't have NEET, Course, and Destination filled
          return (
            lead.assigned_to === currentUser.id &&
            lead.status !== 'Converted' &&
            isEmpty(lead.neet) &&
            isEmpty(lead.course) &&
            isEmpty(lead.destination)
          );
        });

        setLeads(rawLeads);
      } else {
        setError('Failed to fetch leads');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQualifyClick = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name || '',
      city: lead.city || '',
      neet: '',
      course: 'MBBS',
      destination: '',
      fatherName: '',
      fatherPhone: '',
      email: '',
      remark: '',
      source: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLead(null);
    setFormData({
      name: '',
      city: '',
      neet: '',
      course: 'MBBS',
      destination: '',
      fatherName: '',
      fatherPhone: '',
      email: '',
      remark: '',
      source: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitQualification = async (e) => {
    e.preventDefault();

    if (!formData.name) { alert('Please fill student name!'); return; }
    if (!formData.course) { alert('Please select course!'); return; }
    if (formData.course === 'MBBS' && !formData.neet) {
      alert('Please fill NEET Score!');
      return;
    }
    if (formData.course === 'Other' && !formData.neet) {
      alert('Please fill Exam/Score!');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchWithRetry(`${API_URL}/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          city: formData.city || '',
          neet: formData.neet,
          course: formData.course,
          destination: formData.destination || '',
          father_name: formData.fatherName || '',
          father_phone: formData.fatherPhone || '',
          email: formData.email || '',
          remark: formData.remark || '',
          source: formData.source || 'Telecaller Qualified',
          status: 'Contacted'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Lead qualified successfully!');
        handleCloseModal();
        fetchRawLeads(); // Refresh the list
      } else {
        alert('Failed to qualify lead: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error qualifying lead:', err);
      alert('Error qualifying lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle call status click
  const handleCallStatusClick = (lead) => {
    setCallStatusLead(lead);
    setCallRemark('');
    setCallStatusModal(true);
  };

  // Handle call status submission
  const handleCallStatusSubmit = async (status) => {
    if (!callStatusLead) return;

    setSubmitting(true);
    try {
      const response = await fetchWithRetry(`${API_URL}/leads/${callStatusLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status,
          remark: callRemark || `Call Status: ${status}`
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Lead marked as "${status}" successfully!`);
        setCallStatusModal(false);
        setCallStatusLead(null);
        setCallRemark('');
        fetchRawLeads(); // Refresh the list
      } else {
        alert('Failed to update lead: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Error updating lead. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle city edit click
  const handleCityEditClick = (lead) => {
    setCityEditLead(lead);
    setCityValue(lead.city || '');
    setCityEditModal(true);
  };

  // Handle city update
  const handleCityUpdate = async () => {
    if (!cityEditLead) return;

    setSubmitting(true);
    try {
      const response = await fetchWithRetry(`${API_URL}/leads/${cityEditLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityValue.trim()
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('City updated successfully!');
        setCityEditModal(false);
        setCityEditLead(null);
        setCityValue('');
        fetchRawLeads(); // Refresh the list
      } else {
        alert('Failed to update city: ' + (result.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating city:', err);
      alert('Error updating city. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading raw leads...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-4xl font-bold text-gray-900 flex items-center gap-2 md:gap-3 mb-2">
          <User size={28} className="text-blue-600 md:w-10 md:h-10" />
          Raw Leads - Qualify Students
        </h1>
        <p className="text-gray-600 text-sm md:text-lg">
          {currentUser?.role} — Convert raw leads into qualified students by adding their details
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-90">Total Raw Leads</p>
            <p className="text-4xl font-bold">{leads.length}</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl">
            <User size={48} />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <User className="mx-auto mb-4 text-gray-400" size={64} />
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No Raw Leads</h3>
          <p className="text-gray-500">All leads have been qualified or there are no new leads available.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-6 py-4 text-left font-bold">Name</th>
                  <th className="px-6 py-4 text-left font-bold">Phone</th>
                  <th className="px-6 py-4 text-left font-bold">City</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-left font-bold">Remark</th>
                  <th className="px-6 py-4 text-center font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-600" />
                        <a href={`tel:${lead.phone}`} className="font-mono text-blue-600 hover:underline">{lead.phone}</a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {lead.city ? (
                          <>
                            <MapPin size={16} className="text-gray-600" />
                            <span className="text-gray-700">{lead.city}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No City</span>
                        )}
                        <button onClick={() => handleCityEditClick(lead)} className="ml-1 p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Edit City">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.status === 'New' ? (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">New (Raw)</span>
                      ) : lead.status === 'Not Connected' ? (
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">Not Connected</span>
                      ) : lead.status === 'Call Back' ? (
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">Call Back</span>
                      ) : lead.status === 'Wrong Number' ? (
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">Wrong Number</span>
                      ) : lead.status === 'Not Interested' ? (
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">Not Interested</span>
                      ) : (
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">{lead.status}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.remark ? (
                        <span className="text-gray-600 text-sm max-w-[200px] truncate block" title={lead.remark}>{lead.remark}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleQualifyClick(lead)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center gap-1"
                        >
                          <PhoneCall size={16} />
                          Qualify
                        </button>
                        <button
                          onClick={() => handleCallStatusClick(lead)}
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-bold hover:from-orange-600 hover:to-red-600 transition-all shadow-md flex items-center gap-1"
                        >
                          <PhoneOff size={16} />
                          Not Connected
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Qualification Modal */}
      {showModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex items-center justify-between sticky top-0">
              <div>
                <h2 className="text-2xl font-bold mb-1">Qualify Lead</h2>
                <p className="opacity-90">{selectedLead.name}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Lead Info - Phone fixed */}
            <div className="bg-blue-50 p-4 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-blue-600" />
                <span className="font-mono font-semibold">{selectedLead.phone}</span>
              </div>
            </div>

            {/* Qualification Form */}
            <form onSubmit={handleSubmitQualification} className="p-6 space-y-4">

              {/* 1. Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><User size={16} className="text-blue-600" />Student Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter student name" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" required />
              </div>

              {/* 2. City */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><MapPin size={16} className="text-blue-600" />City {!selectedLead?.city && <span className="text-red-500">(Missing)</span>}</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter city name" className={`w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none text-base ${!formData.city ? 'border-orange-300 bg-orange-50' : 'border-gray-300'}`} />
              </div>

              {/* 3. Course */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><FileText size={16} className="text-blue-600" />Course *</label>
                <select name="course" value={formData.course} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" required>
                  <option value="MBBS">MBBS</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* MBBS: NEET Score */}
              {formData.course === 'MBBS' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><GraduationCap size={16} className="text-blue-600" />NEET Score *</label>
                  <input type="number" name="neet" value={formData.neet} onChange={handleInputChange} placeholder="e.g., 520" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" min="0" />
                </div>
              )}

              {/* Other: Exam/Score */}
              {formData.course === 'Other' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><GraduationCap size={16} className="text-blue-600" />Exam / Score *</label>
                  <input type="text" name="neet" value={formData.neet} onChange={handleInputChange} placeholder="e.g., JEE 85%, CLAT 120" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" />
                </div>
              )}

              {/* Email ID - both */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><MessageSquare size={16} className="text-blue-600" />Email ID</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="student@gmail.com" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" />
              </div>

              {/* Father Name - both */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><User size={16} className="text-blue-600" />Father's Name</label>
                <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Enter father's name" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" />
              </div>

              {/* Father Mobile - both */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><Phone size={16} className="text-blue-600" />Father's Mobile Number</label>
                <input type="tel" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} placeholder="Enter father's mobile number" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" />
              </div>

              {/* Destination - both */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><Globe size={16} className="text-blue-600" />{formData.course === 'MBBS' ? 'Preferred Destination' : 'Destination'}</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} placeholder="e.g., Russia, Philippines, Delhi" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base" />
              </div>

              {/* Remark */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2"><MessageSquare size={16} className="text-blue-600" />Remark / Notes</label>
                <textarea name="remark" value={formData.remark} onChange={handleInputChange} placeholder="Add any additional notes..." rows="3" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base resize-none" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={20} />
                      Qualify Lead
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Status Modal */}
      {callStatusModal && callStatusLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Call Status</h2>
                <p className="opacity-90">{callStatusLead.name}</p>
              </div>
              <button
                onClick={() => {
                  setCallStatusModal(false);
                  setCallStatusLead(null);
                  setCallRemark('');
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Lead Info */}
            <div className="bg-orange-50 p-4 border-b border-orange-100">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-orange-600" />
                <span className="font-mono font-semibold">{callStatusLead.phone}</span>
              </div>
            </div>

            {/* Call Status Options */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 font-semibold mb-4">Select call outcome:</p>

              {/* Remark Input */}
              <div className="mb-4">
                <label className="text-sm font-bold text-gray-700 mb-2 block">Add Remark (Optional)</label>
                <textarea
                  value={callRemark}
                  onChange={(e) => setCallRemark(e.target.value)}
                  placeholder="Add any notes about this call..."
                  rows="2"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>

              {/* Status Buttons */}
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleCallStatusSubmit('Not Connected')}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border-2 border-gray-300"
                >
                  <PhoneOff size={20} className="text-gray-600" />
                  Not Connected / No Answer
                </button>

                <button
                  onClick={() => handleCallStatusSubmit('Call Back')}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border-2 border-yellow-300"
                >
                  <Clock size={20} className="text-yellow-600" />
                  Call Back Later
                </button>

                <button
                  onClick={() => handleCallStatusSubmit('Wrong Number')}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border-2 border-red-300"
                >
                  <X size={20} className="text-red-600" />
                  Wrong Number
                </button>

                <button
                  onClick={() => handleCallStatusSubmit('Not Interested')}
                  disabled={submitting}
                  className="w-full px-4 py-3 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg font-bold transition-all flex items-center justify-center gap-2 border-2 border-orange-300"
                >
                  <PhoneOff size={20} className="text-orange-600" />
                  Not Interested
                </button>
              </div>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setCallStatusModal(false);
                  setCallStatusLead(null);
                  setCallRemark('');
                }}
                className="w-full mt-4 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* City Edit Modal */}
      {cityEditModal && cityEditLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Edit City</h2>
                    <p className="text-blue-100 text-sm">{cityEditLead.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCityEditModal(false);
                    setCityEditLead(null);
                    setCityValue('');
                  }}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="text-sm font-bold text-gray-700 mb-2 block">City Name</label>
              <input
                type="text"
                value={cityValue}
                onChange={(e) => setCityValue(e.target.value)}
                placeholder="Enter city name..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                autoFocus
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setCityEditModal(false);
                  setCityEditLead(null);
                  setCityValue('');
                }}
                className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCityUpdate}
                disabled={submitting || !cityValue.trim()}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? 'Saving...' : (
                  <>
                    <Save size={16} />
                    Save City
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelecallerRawLeads;
