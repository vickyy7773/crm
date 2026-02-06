import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Phone, Briefcase, Building2, CheckCircle, AlertCircle, ArrowLeft, Loader, Lock } from 'lucide-react';
import API_URL from '../config/api';

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phone: '',
    department: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields'
      });
      setSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid email address'
      });
      setSubmitting(false);
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters long'
      });
      setSubmitting(false);
      return;
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match'
      });
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message
        });
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: '',
          phone: '',
          department: '',
          status: 'active'
        });
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/users/all');
        }, 2000);
      } else {
        setMessage({
          type: 'error',
          text: result.message
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Error connecting to server. Make sure the backend is running.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate('/users/all')}
          className="flex items-center gap-1 md:gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-3 md:mb-4 text-sm md:text-base transition-colors"
        >
          <ArrowLeft size={16} className="md:w-5 md:h-5" />
          Back to All Users
        </button>
        <h1 className="text-xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Add User</h1>
        <p className="text-gray-600 text-sm md:text-lg">Add a new team member to your organization</p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-2 md:gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          )}
          <p className={`font-semibold text-sm md:text-base ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* Name */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserPlus className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Password and Confirm Password - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {/* Password */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  required
                />
              </div>
              <p className="text-[10px] md:text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                  className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Role and Phone - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {/* Role */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none bg-white"
                  required
                >
                  <option value="">Select role</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Department and Status - Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
            {/* Department */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Select department</option>
                  <option value="Telecalling">Telecalling</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg md:rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Add User
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/users/all')}
              className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 text-gray-700 rounded-lg md:rounded-xl font-bold hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
