import { useState } from 'react';
import { X, Phone, MessageSquare, Calendar, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

// Sub-options for each Call Outcome
const outcomeSubOptions = {
  'Interested': [
    { value: 'Abroad', label: '🌍 Abroad' },
    { value: 'Counselling Only', label: '💬 Counselling Only' },
    { value: 'BDS / BAMS', label: '🦷 BDS / BAMS' },
  ],
  'Office Visit': [
    { value: 'Address Shared', label: '📍 Address Shared' },
    { value: 'Visit Scheduled', label: '📅 Visit Scheduled' },
    { value: 'Visit Done', label: '✅ Visit Done' },
  ],
  'Counseling Done': [
    { value: 'Admission Likely', label: '✅ Admission Likely' },
    { value: 'Documents Pending', label: '📄 Documents Pending' },
    { value: 'Follow-up Needed', label: '🔄 Follow-up Needed' },
  ],
  'Follow Up': [
    { value: 'Details Shared', label: '📋 Details Shared' },
    { value: 'Discussed on Phone', label: '📞 Discussed on Phone' },
    { value: 'Documents Pending', label: '📄 Documents Pending' },
    { value: 'Meeting Planned', label: '📅 Meeting Planned' },
  ],
  'After Result / Counseling': [
    { value: 'Waiting NEET Result', label: '⏳ Waiting NEET Result' },
    { value: 'Waiting Counseling', label: '🎓 Waiting Counseling' },
  ],
  'India': [
    { value: 'Government College', label: '🏛️ Government College' },
    { value: 'Private College', label: '🏥 Private College' },
    { value: 'Deemed University', label: '🎓 Deemed University' },
  ],
  'Call Back': [
    { value: 'Not Reachable', label: '📴 Not Reachable' },
    { value: 'Busy', label: '📵 Busy' },
    { value: 'Call Back 2-3 Days', label: '🔄 Call Back 2–3 Days' },
    { value: 'Call Back Next Week', label: '📆 Call Back Next Week' },
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
  'Converted': [
    { value: 'MBBS Abroad', label: '🌍 MBBS Abroad' },
    { value: 'MBBS India', label: '🇮🇳 MBBS India' },
    { value: 'Other Course', label: '📚 Other Course' },
  ],
};

// Outcomes that need follow-up date
const followUpOutcomes = ['Interested', 'Follow Up', 'Call Back', 'Office Visit', 'After Result / Counseling', 'Counseling Done', 'India'];

// Outcomes where follow-up is required
const requiredFollowUpOutcomes = ['Call Back', 'Follow Up'];

// Negative outcomes (for styling)
const negativeOutcomes = ['Not Interested', 'Drop', 'Invalid Lead'];

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

const CallLogModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const { user } = useAuth();
  const [callRemark, setCallRemark] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [callReason, setCallReason] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const hasSubOptions = callOutcome && outcomeSubOptions[callOutcome];
  const isNegativeOutcome = negativeOutcomes.includes(callOutcome);
  const showFollowUp = followUpOutcomes.includes(callOutcome);
  const isFollowUpRequired = requiredFollowUpOutcomes.includes(callOutcome);

  const handleOutcomeChange = (value) => {
    setCallOutcome(value);
    setCallReason(''); // Reset sub-option when outcome changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!callRemark.trim() || !callOutcome) {
      alert('Please fill in call remark and outcome');
      return;
    }

    // Validate sub-option selection
    if (hasSubOptions && !callReason) {
      alert('Please select a sub-option for the selected outcome.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchWithRetry(`${API_URL}/leads/${lead.id}/call-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerId: user.id,
          callerName: user.name,
          callRemark: callRemark.trim(),
          callOutcome,
          callReason: callReason || null,
          nextFollowUpDate: nextFollowUpDate || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Call log added successfully!');
        setCallRemark('');
        setCallOutcome('');
        setCallReason('');
        setNextFollowUpDate('');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        console.error('Backend error response:', result);
        alert('Failed to add call log: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding call log:', error);
      alert('Error adding call log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                <Phone size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add Call Log</h2>
                <p className="text-blue-100 text-sm">
                  {lead.name} - {lead.phone}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 1. Call Outcome */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Phone size={16} />
              Call Outcome <span className="text-red-500">*</span>
            </label>
            <select
              value={callOutcome}
              onChange={(e) => handleOutcomeChange(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium bg-white"
              required
            >
              <option value="">-- Select Outcome --</option>
              <option value="Interested">⭐ Interested</option>
              <option value="Office Visit">🏢 Office Visit</option>
              <option value="Counseling Done">🤝 Counseling Done</option>
              <option value="Follow Up">📋 Follow Up</option>
              <option value="After Result / Counseling">🎓 After Result / Counseling</option>
              <option value="India">🇮🇳 India</option>
              <option value="Call Back">🔄 Call Back</option>
              <option value="Other Course">📚 Other Course</option>
              <option value="Drop">❌ Drop</option>
              <option value="Not Interested">✖ Not Interested</option>
              <option value="Invalid Lead">🚫 Invalid Lead</option>
              <option value="Converted">🎉 Converted</option>
            </select>
          </div>

          {/* 2. Sub-Dropdown based on Call Outcome */}
          {hasSubOptions && (
            <div className={`border-2 rounded-xl p-4 ${isNegativeOutcome ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
              <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${isNegativeOutcome ? 'text-red-900' : 'text-blue-900'}`}>
                <ChevronRight size={16} />
                {callOutcome} - Sub Category <span className="text-red-500">*</span>
              </label>
              <select
                value={callReason}
                onChange={(e) => setCallReason(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 outline-none transition-all text-sm font-medium bg-white ${
                  isNegativeOutcome
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-blue-300 focus:border-blue-500 focus:ring-blue-200'
                }`}
                required
              >
                <option value="">-- Select {callOutcome} Reason --</option>
                {outcomeSubOptions[callOutcome].map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Next Follow-up Date */}
          {showFollowUp && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-900 mb-2">
                <Calendar size={16} />
                Next Follow-up Date
                {isFollowUpRequired && <span className="text-red-500">*</span>}
              </label>
              <input
                type="datetime-local"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm bg-white"
                required={isFollowUpRequired}
              />
              <p className="text-xs text-purple-600 mt-1">
                {isFollowUpRequired
                  ? 'Required: Schedule next call date and time'
                  : 'Optional: Set reminder for follow-up'}
              </p>
            </div>
          )}

          {/* 4. Call Remark */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare size={16} />
              Call Remark <span className="text-red-500">*</span>
            </label>
            <textarea
              value={callRemark}
              onChange={(e) => setCallRemark(e.target.value)}
              rows={3}
              placeholder="Enter details about the call..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm resize-none"
              required
            />
          </div>

          {/* Auto-filled Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Auto-filled Information
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Caller:</p>
                <p className="font-semibold text-gray-900">{user.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Call Date/Time:</p>
                <p className="font-semibold text-gray-900">
                  {new Date().toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !callRemark.trim() || !callOutcome}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save Call Log'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallLogModal;
