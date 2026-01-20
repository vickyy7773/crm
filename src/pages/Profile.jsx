import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Target,
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

import API_URL from '../config/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@pulseeducation.com',
    phone: user?.phone || '+91 9876543210',
    role: user?.role || 'Admin',
    department: user?.department || 'Sales',
    location: user?.location || 'Mumbai, India',
    joinDate: user?.joinDate || 'January 2024'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Make API call to update user profile
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          department: formData.department
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update user context with new data
        if (updateUser) {
          updateUser(data.data);
        }

        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(`Failed to update profile: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || 'Admin User',
      email: user?.email || 'admin@pulseeducation.com',
      phone: user?.phone || '+91 9876543210',
      role: user?.role || 'Admin',
      department: user?.department || 'Sales',
      location: user?.location || 'Mumbai, India',
      joinDate: user?.joinDate || 'January 2024'
    });
    setIsEditing(false);
  };

  // Sample statistics
  const stats = [
    { label: 'Total Leads', value: '248', icon: Target, color: 'bg-blue-500', change: '+12%' },
    { label: 'Conversions', value: '86', icon: CheckCircle, color: 'bg-green-500', change: '+8%' },
    { label: 'In Progress', value: '42', icon: Clock, color: 'bg-yellow-500', change: '+5%' },
    { label: 'Success Rate', value: '68%', icon: TrendingUp, color: 'bg-purple-500', change: '+3%' }
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
          >
            <Edit2 size={20} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              <X size={20} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Gradient Header */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 h-32"></div>

            {/* Profile Picture */}
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center -mt-16">
                <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <UserCircle className="text-white" size={80} />
                  </div>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">{formData.name}</h2>
                <p className="text-purple-600 font-semibold">{formData.role}</p>
                <p className="text-gray-500 text-sm mt-1">{formData.department} Department</p>
              </div>

              {/* Quick Info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail size={18} className="text-purple-500" />
                  <span className="text-sm">{formData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone size={18} className="text-purple-500" />
                  <span className="text-sm">{formData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={18} className="text-purple-500" />
                  <span className="text-sm">{formData.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={18} className="text-purple-500" />
                  <span className="text-sm">Joined {formData.joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Details & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <stat.icon className="text-white" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
                <p className="text-xs text-green-600 font-semibold mt-2">{stat.change} this month</p>
              </div>
            ))}
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase size={24} className="text-purple-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{formData.name}</p>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{formData.email}</p>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{formData.phone}</p>
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                {isEditing ? (
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Team Lead">Team Lead</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{formData.role}</p>
                  </div>
                )}
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                {isEditing ? (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Support">Support</option>
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{formData.department}</p>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">{formData.location}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
              <button
                onClick={() => navigate('/activity')}
                className="text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                View All Activity →
              </button>
            </div>
            <div className="space-y-4">
              {[
                { action: 'Added new lead', detail: 'John Doe - MBBS Russia', time: '2 hours ago', color: 'bg-green-100 text-green-600' },
                { action: 'Updated lead status', detail: 'Changed to "In Progress"', time: '5 hours ago', color: 'bg-blue-100 text-blue-600' },
                { action: 'Completed follow-up', detail: 'Called Sarah Johnson', time: '1 day ago', color: 'bg-purple-100 text-purple-600' },
                { action: 'Imported leads', detail: '15 new leads from CSV', time: '2 days ago', color: 'bg-yellow-100 text-yellow-600' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-lg font-bold">{activity.action.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.detail}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
