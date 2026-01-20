import { useState } from 'react';
import { X, Phone, MessageSquare, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

const CallLogModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const { user } = useAuth();
  const [callRemark, setCallRemark] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [callReason, setCallReason] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [duration, setDuration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  // Check if outcome is negative (requires reason)
  const negativeOutcomes = ['Not Interested', 'Not Reachable', 'Drop'];
  const isNegativeOutcome = negativeOutcomes.includes(callOutcome);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!callRemark.trim() || !callOutcome) {
      alert('Please fill in call remark and outcome');
      return;
    }

    // Validate remark length (min 20 characters)
    if (callRemark.trim().length < 20) {
      alert('Call remark must be at least 20 characters long. Please provide detailed information.');
      return;
    }

    // Check for blocked generic words
    const blockedWords = ['ok', 'done', 'talked', 'call done', 'called'];
    const remarkLower = callRemark.toLowerCase().trim();
    const hasBlockedWord = blockedWords.some(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(remarkLower);
    });

    if (hasBlockedWord) {
      alert('Please avoid generic words like "ok", "done", "talked". Provide specific details about the conversation.');
      return;
    }

    // Validate call reason for negative outcomes
    if (isNegativeOutcome && !callReason) {
      alert('Please select a reason for this negative outcome.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/leads/${lead.id}/call-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callerId: user.id,
          callerName: user.name,
          callRemark: callRemark.trim(),
          callOutcome,
          callReason: callReason || null,
          nextFollowUpDate: nextFollowUpDate || null,
          duration: duration || null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Call log added successfully!');
        setCallRemark('');
        setCallOutcome('');
        setCallReason('');
        setNextFollowUpDate('');
        setDuration('');
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
          {/* Call Remark */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <MessageSquare size={16} />
              Call Remark <span className="text-red-500">*</span>
            </label>
            <textarea
              value={callRemark}
              onChange={(e) => setCallRemark(e.target.value)}
              rows={4}
              placeholder="Enter details about the call (what was discussed, student's concerns, etc.)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm resize-none"
              required
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                Be detailed: mention course preference, budget, timeline, etc.
              </p>
              <p className={`text-xs font-semibold ${callRemark.trim().length >= 20 ? 'text-green-600' : 'text-red-500'}`}>
                {callRemark.trim().length}/20 chars
              </p>
            </div>
          </div>

          {/* Call Outcome */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Phone size={16} />
              Call Outcome <span className="text-red-500">*</span>
            </label>
            <select
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium bg-white"
              required
            >
              <option value="">-- Select Outcome --</option>
              <option value="Contacted">📞 Contacted</option>
              <option value="Interested">⭐ Interested</option>
              <option value="Call Back">🔄 Call Back</option>
              <option value="Not Interested">✖ Not Interested</option>
              <option value="Converted">✅ Converted</option>
              <option value="Not Reachable">📴 Not Reachable</option>
              <option value="Office Visit">🏢 Office Visit</option>
              <option value="Drop">❌ Drop</option>
            </select>
          </div>

          {/* Call Reason - Only for negative outcomes */}
          {isNegativeOutcome && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-red-900 mb-2">
                <MessageSquare size={16} />
                Call Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={callReason}
                onChange={(e) => setCallReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all text-sm font-medium bg-white"
                required={isNegativeOutcome}
              >
                <option value="">-- Select Reason --</option>
                <option value="Budget Issue">💰 Budget Issue</option>
                <option value="Parents Not Agree">👨‍👩‍👧 Parents Not Agree</option>
                <option value="Already Applied Elsewhere">📄 Already Applied Elsewhere</option>
                <option value="Not Eligible">❌ Not Eligible</option>
                <option value="Language Issue">🗣️ Language Issue</option>
                <option value="Wrong Contact">📞 Wrong Contact</option>
                <option value="Not Interested (General)">🚫 Not Interested (General)</option>
                <option value="Other">❓ Other</option>
              </select>
              <p className="text-xs text-red-600 mt-2 font-medium">
                Required: Please specify why this outcome is negative
              </p>
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Clock size={16} />
              Call Duration (minutes)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="0"
              placeholder="e.g., 5"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm"
            />
          </div>

          {/* Next Follow-up Date */}
          {(callOutcome === 'Call Back' || callOutcome === 'Interested' || callOutcome === 'Contacted') && (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-purple-900 mb-2">
                <Calendar size={16} />
                Next Follow-up Date
                {callOutcome === 'Call Back' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="datetime-local"
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-sm bg-white"
                required={callOutcome === 'Call Back'}
              />
              <p className="text-xs text-purple-600 mt-1">
                {callOutcome === 'Call Back'
                  ? 'Required: Schedule next call date and time'
                  : 'Optional: Set reminder for follow-up'}
              </p>
            </div>
          )}

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
