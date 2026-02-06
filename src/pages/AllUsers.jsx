import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Mail, Phone, Briefcase, Building2, Edit2, Trash2, Loader, CheckCircle, XCircle, Key, X } from 'lucide-react';
import API_URL from '../config/api';

const AllUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/users`);
      const result = await response.json();

      if (result.success) {
        setUsers(result.data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error connecting to server. Make sure the backend is running on port 5000.');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setUsers(users.filter(user => user.id !== id));
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };

  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setResetPasswordModal(true);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const closeResetPasswordModal = () => {
    setResetPasswordModal(false);
    setSelectedUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword || !confirmNewPassword) {
      alert('Please fill in both password fields');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setResetting(true);
      const response = await fetch(`${API_URL}/users/${selectedUser.id}/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Password reset successfully for ${selectedUser.name}`);
        closeResetPasswordModal();
      } else {
        alert(result.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password');
    } finally {
      setResetting(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      'Admin': 'from-red-500 to-red-600',
      'Manager': 'from-blue-500 to-blue-600',
      'Counselor': 'from-green-500 to-green-600',
      'Sales Representative': 'from-purple-500 to-purple-600',
      'Support Staff': 'from-gray-500 to-gray-600',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${roleColors[role] || 'from-gray-500 to-gray-600'} shadow-sm`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-green-700 bg-green-100 border border-green-300">
        <CheckCircle size={12} />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300">
        <XCircle size={12} />
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-600 text-lg">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-800 font-semibold mb-2">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1 md:mb-2">Team Members</h1>
            <p className="text-gray-600 text-sm md:text-lg">Manage your team members and their roles</p>
          </div>
          <button
            onClick={() => navigate('/users/add')}
            className="flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg md:rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            <UserPlus size={16} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Add New</span> User
          </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 border border-gray-100">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-blue-50 p-2 md:p-4 rounded-lg md:rounded-xl">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Total Users</p>
              <p className="text-2xl md:text-4xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 border border-gray-100">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-green-50 p-2 md:p-4 rounded-lg md:rounded-xl">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Active</p>
              <p className="text-2xl md:text-4xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6 border border-gray-100">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="bg-purple-50 p-2 md:p-4 rounded-lg md:rounded-xl">
              <Briefcase className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-gray-600 text-xs md:text-sm font-semibold">Departments</p>
              <p className="text-2xl md:text-4xl font-bold text-gray-900">
                {new Set(users.map(u => u.department).filter(d => d)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {users.length > 0 ? (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">User</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden lg:table-cell">Role</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-white uppercase tracking-wider hidden lg:table-cell">Dept</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Status</th>
                  <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-purple-50 hover:via-pink-50 hover:to-blue-50 transition-all duration-200">
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-md flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-900 text-sm md:text-base truncate">{user.name}</div>
                          <div className="text-xs text-gray-500 md:hidden truncate">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-gray-400" />
                          <span className="text-gray-700">{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-gray-400" />
                            <span className="text-gray-700">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 hidden lg:table-cell">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4 hidden lg:table-cell">
                      {user.department ? (
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-gray-700 font-medium">{user.department}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-3 md:px-6 py-2 md:py-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        <button className="p-1.5 md:p-0 md:px-3 md:py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs md:text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow">
                          <Edit2 size={14} className="md:hidden" />
                          <span className="hidden md:inline-flex items-center gap-1"><Edit2 size={14} />Edit</span>
                        </button>
                        <button
                          onClick={() => openResetPasswordModal(user)}
                          className="p-1.5 md:p-0 md:px-3 md:py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs md:text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-sm hover:shadow"
                        >
                          <Key size={14} className="md:hidden" />
                          <span className="hidden md:inline-flex items-center gap-1"><Key size={14} />Reset</span>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 md:p-0 md:px-3 md:py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg text-xs md:text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-sm hover:shadow"
                        >
                          <Trash2 size={14} className="md:hidden" />
                          <span className="hidden md:inline-flex items-center gap-1"><Trash2 size={14} />Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-8 md:p-12 text-center">
          <Users className="mx-auto mb-4 text-gray-300" size={48} />
          <h3 className="text-lg md:text-xl font-bold text-gray-700 mb-2">No users yet</h3>
          <p className="text-gray-500 text-sm md:text-base mb-4">Add your first team member to get started!</p>
          <button
            onClick={() => navigate('/users/add')}
            className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg md:rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
          >
            <UserPlus size={18} />
            Add First User
          </button>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 md:p-6 rounded-t-xl md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-2 border-white/30">
                    <Key size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold">Reset Password</h2>
                    <p className="text-green-100 text-xs md:text-sm">for {selectedUser.name}</p>
                  </div>
                </div>
                <button
                  onClick={closeResetPasswordModal}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
                  <X size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-3 md:p-6 space-y-3 md:space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg md:rounded-xl p-3 md:p-4">
                <p className="text-yellow-800 text-xs md:text-sm font-semibold">
                  ⚠️ This will reset the password for {selectedUser.email}
                </p>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs md:text-sm font-bold text-gray-700 mb-1 md:mb-2">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm border-2 border-gray-200 rounded-lg md:rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-3 md:p-4 rounded-b-xl md:rounded-b-2xl flex items-center justify-end gap-2 md:gap-3">
              <button
                onClick={closeResetPasswordModal}
                disabled={resetting}
                className="px-4 md:px-6 py-2 md:py-3 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting}
                className="flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetting ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    <span className="hidden md:inline">Resetting...</span>
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Reset
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

export default AllUsers;
