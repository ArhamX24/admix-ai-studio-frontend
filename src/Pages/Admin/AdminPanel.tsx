import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, X, Save, Loader2, 
  AlertCircle, CheckCircle, Eye, EyeOff, Sparkles, Shield
} from 'lucide-react';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Swal from 'sweetalert2';
import { baseURL } from '@/Utils/URL';

interface User {
  id: string;
  email: string;
  role: string;
  assignedRole?: {
    roleType: string;
    isActive: boolean;
  } | null;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const userTypes = [
    { value: 'VIDEO_GENERATOR', label: 'Video Generator', icon: '🎥', gradient: 'from-violet-500 to-purple-600' },
    { value: 'NEWS_GENERATOR', label: 'News Generator', icon: '📰', gradient: 'from-blue-500 to-indigo-600' },
    { value: 'VOICE_GENERATOR', label: 'Voice Generator', icon: '🎤', gradient: 'from-emerald-500 to-teal-600' },
    { value: 'SCRIPT_WRITER', label: 'Script Writer', icon: '✍️', gradient: 'from-amber-500 to-orange-600' }
  ];

  // Dynamic Validation Schema
  const getValidationSchema = () => {
    return Yup.object({
      email: Yup.string()
        .email('Please enter a valid email address')
        .required('Email is required'),
      password: editingUser 
        ? Yup.string().min(8, 'Password must be at least 8 characters')
        : Yup.string()
            .min(8, 'Password must be at least 8 characters')
            .required('Password is required'),
      userRole: Yup.string().required('Please select a user type')
    });
  };

  // Formik setup
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      userRole: ''
    },
    validationSchema: getValidationSchema(),
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (editingUser) {
        await handleUpdateUser(values);
      } else {
        await handleCreateUser(values);
      }
    }
  });

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${baseURL}/api/v1/admin/get-all-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error: any) {
      console.log(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to fetch users',
        background: '#1e293b',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    formik.resetForm();
    setEditingUser(null);
    setShowModal(false);
    setShowPassword(false);
  };

  const handleCreateUser = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');

      const roleMapping: Record<string, string> = {
        'VIDEO_GENERATOR': 'video',
        'NEWS_GENERATOR': 'news',
        'VOICE_GENERATOR': 'voice',
        'SCRIPT_WRITER': 'script'
      };

      const payload = {
        email: values.email,
        password: values.password,
        role: roleMapping[values.userRole]
      };

      const response = await axios.post(
        `${baseURL}/api/v1/user/register-email`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'User created successfully',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#fff'
        });
        fetchUsers();
        resetForm();
      }
    } catch (error: any) {

      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to create user',
        background: '#1e293b',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Update basic user info (email, password)
      const updateData: any = { email: values.email };
      
      if (values.password) {
        updateData.password = values.password;
      }

      const updateResponse = await axios.put(
        `${baseURL}/api/v1/admin/update-user/${editingUser.id}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update role if changed
      const currentRole = editingUser.assignedRole?.roleType || editingUser.role;
      if (values.userRole !== currentRole) {
        await axios.post(
          `${baseURL}/api/v1/admin/assign-role`,
          {
            userId: editingUser.id,
            roleType: values.userRole
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (updateResponse.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'User updated successfully',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#fff'
        });
        fetchUsers();
        resetForm();
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update user',
        background: '#1e293b',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
      background: '#1e293b',
      color: '#fff'
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(
        `${baseURL}/api/v1/admin/delete-user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'User has been deleted.',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#fff'
        });
        fetchUsers();
      }
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to delete user',
        background: '#1e293b',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    formik.setValues({
      email: user.email,
      password: '',
      userRole: user.assignedRole?.roleType || user.role
    });
    setShowModal(true);
  };

  const getRoleGradient = (role: string) => {
    const gradients: Record<string, string> = {
      VIDEO_GENERATOR: 'from-violet-500 to-purple-600',
      NEWS_GENERATOR: 'from-blue-500 to-indigo-600',
      VOICE_GENERATOR: 'from-emerald-500 to-teal-600',
      SCRIPT_WRITER: 'from-amber-500 to-orange-600',
      ADMIN: 'from-rose-500 to-red-600'
    };
    return gradients[role] || 'from-slate-500 to-slate-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-gray-100 p-4 md:p-8">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl shadow-lg shadow-violet-500/20">
                  <Shield className="text-white" size={32} />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-100">
                    Admin Panel
                  </h1>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 font-semibold hover:scale-105 active:scale-95"
            >
              <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              Add New User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="text-3xl font-bold text-violet-400">
              {users.length}
            </div>
            <div className="text-gray-400 text-sm mt-1">Total Users</div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-slate-800/50 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-violet-600/20 border border-violet-500/20 rounded-xl">
              <Users className="text-violet-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-100">Team Members</h2>
          </div>

          {loading && !showModal ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="animate-spin text-violet-400 mb-4" size={48} />
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block p-6 bg-slate-800/40 border border-slate-700/50 rounded-3xl mb-6">
                <Users size={64} className="text-violet-400 opacity-50" />
              </div>
              <p className="text-gray-400 text-lg">No users found. Create your first team member!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className="group bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${user.assignedRole?.isActive ? 'bg-emerald-400' : 'bg-slate-500'} animate-pulse`}></div>
                        <h3 className="font-semibold text-gray-100 truncate group-hover:text-violet-400 transition-colors">
                          {user.email}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r ${
                      getRoleGradient(user.assignedRole?.roleType || user.role)
                    } text-white shadow-lg`}>
                      <span className="text-xl">
                        {userTypes.find(t => t.value === (user.assignedRole?.roleType || user.role))?.icon || '👤'}
                      </span>
                      {user.assignedRole?.roleType || user.role}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openEditModal(user)}
                      className="flex-1 group/btn flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600 border border-blue-600/30 hover:border-blue-600 text-blue-400 hover:text-white rounded-xl transition-all duration-300 text-sm font-semibold hover:shadow-lg hover:shadow-blue-600/25"
                    >
                      <Edit2 size={16} className="group-hover/btn:rotate-12 transition-transform" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={loading}
                      className="flex-1 group/btn flex items-center justify-center gap-2 px-4 py-3 bg-rose-600/20 hover:bg-rose-600 border border-rose-600/30 hover:border-rose-600 text-rose-400 hover:text-white rounded-xl transition-all duration-300 text-sm font-semibold hover:shadow-lg hover:shadow-rose-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl border border-slate-700/50 p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-100">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-100 hover:bg-slate-800 rounded-xl transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    formik.touched.email && formik.errors.email
                      ? 'border-rose-500 focus:ring-rose-500'
                      : 'border-slate-700 focus:ring-violet-500 focus:border-transparent'
                  }`}
                  placeholder="user@example.com"
                />
                {formik.touched.email && formik.errors.email && (
                  <div className="flex items-center gap-2 mt-2 text-rose-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{formik.errors.email}</span>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Password {editingUser && <span className="text-gray-500 font-normal">(Leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                      formik.touched.password && formik.errors.password
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-700 focus:ring-violet-500 focus:border-transparent'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-100 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <div className="flex items-center gap-2 mt-2 text-rose-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{formik.errors.password}</span>
                  </div>
                )}
              </div>

              {/* User Type Selection - Always show for both create and edit */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-4">
                  {editingUser ? 'Update User Role' : 'Select User Type'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {userTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => formik.setFieldValue('userRole', type.value)}
                      className={`group p-5 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 active:scale-95 ${
                        formik.values.userRole === type.value
                          ? `border-transparent bg-gradient-to-br ${type.gradient} shadow-xl`
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {type.icon}
                      </div>
                      <div className={`text-sm font-semibold ${
                        formik.values.userRole === type.value ? 'text-white' : 'text-gray-300'
                      }`}>
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
                {formik.touched.userRole && formik.errors.userRole && (
                  <div className="flex items-center gap-2 mt-3 text-rose-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{formik.errors.userRole}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-gray-100 rounded-xl transition-all duration-200 font-semibold border border-slate-700 hover:border-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formik.isValid}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={20} />
                      {editingUser ? 'Update User' : 'Create User'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: translateX(100%) scale(0.8);
            opacity: 0;
          }
          50% {
            transform: translateX(-10%) scale(1.05);
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgb(124, 58, 237), rgb(147, 51, 234));
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgb(109, 40, 217), rgb(126, 34, 206));
        }

        /* Firefox Scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(124, 58, 237) rgba(15, 23, 42, 0.4);
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;