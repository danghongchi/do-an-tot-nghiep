import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import AdminPage from './AdminPage';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';
import { UsersIcon, CheckCircleIcon, UserIcon, BadgeCheckIcon, AcademicCapIcon } from '../../components/icons/AdminIcons';

// Simple message function
const showMessage = (message, options = {}) => {
  const { type = 'info', title = 'Thông báo' } = options;
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300`;
  alertDiv.innerHTML = `<strong>${title}:</strong> ${message}`;
  
  document.body.appendChild(alertDiv);
  setTimeout(() => {
    alertDiv.style.opacity = '0';
    setTimeout(() => document.body.removeChild(alertDiv), 300);
  }, 3000);
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    role: 'user',
    is_active: true,
    email_verified: false,
    send_welcome_email: true
  });
  const pageSize = 10;

  // Filter users based on search term, role, and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil((filteredUsers?.length || 0) / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filteredUsers.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    (async () => {
      try {
        await loadUsers();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      showMessage('Lỗi khi tải danh sách người dùng', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      gender: '',
      role: 'user',
      is_active: true,
      email_verified: false,
      send_welcome_email: true
    });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '', // Don't prefill password for security
      phone: user.phone || '',
      gender: user.gender || '',
      role: user.role || 'user',
      is_active: user.is_active,
      email_verified: user.email_verified || false,
      send_welcome_email: false // Don't send welcome email when editing
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
        showMessage('Cập nhật người dùng thành công', { type: 'success' });
      } else {
        await api.post('/admin/users', formData);
        showMessage('Tạo người dùng thành công', { type: 'success' });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      showMessage('Không thể lưu thông tin người dùng', { type: 'error' });
    }
  };

  const toggleActive = async (u) => {
    try {
      const updated = { is_active: !u.is_active };
      await api.put(`/admin/users/${u.id}/toggle-active`, updated);
      setUsers(prev => prev.map(x => (x.id === u.id ? { ...x, is_active: updated.is_active } : x)));
      showMessage(updated.is_active ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản', { type: 'success' });
    } catch {
      showMessage('Không thể cập nhật trạng thái', { type: 'error' });
    }
  };

  const removeUser = async (u) => {
    if (!window.confirm('Xóa người dùng này?')) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      showMessage('Đã xóa người dùng', { type: 'success' });
    } catch {
      showMessage('Xóa thất bại', { type: 'error' });
    }
  };

  if (loading) {
    return (
      <AdminPage title="Quản lý Người dùng">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-6 grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Quản lý Người dùng">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-blue-700">Tổng người dùng</p>
                <p className="text-3xl font-bold text-blue-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircleIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-green-700">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-900">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-purple-700">Chuyên gia</p>
                <p className="text-3xl font-bold text-purple-900">
                  {users.filter(u => u.role === 'counselor').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BadgeCheckIcon className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-red-700">Quản trị viên</p>
                <p className="text-3xl font-bold text-red-900">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Tất cả vai trò</option>
                <option value="user">Người dùng</option>
                <option value="counselor">Chuyên gia</option>
                <option value="admin">Quản trị viên</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>
          </div>

          {/* Filter Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Hiển thị {pageItems.length} trong tổng số {filteredUsers.length} người dùng
              {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
            </span>
            {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách người dùng</h3>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm người dùng
            </button>
          </div>
        
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NGƯỜI DÙNG
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LIÊN HỆ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    VAI TRÒ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XÁC THỰC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TRẠNG THÁI
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageItems.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {u.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.full_name || 'Chưa có tên'}</div>
                          <div className="text-sm text-gray-500">
                            {u.gender === 'male' ? 'Nam' : 
                             u.gender === 'female' ? 'Nữ' : 
                             u.gender === 'other' ? 'Khác' : 
                             'Chưa xác định'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{u.email}</div>
                      <div className="text-sm text-gray-500">{u.phone || 'Chưa có số điện thoại'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={u.role === 'admin' ? 'red' : u.role === 'counselor' ? 'purple' : 'blue'}>
                        {u.role === 'admin' ? 'Quản trị viên' : u.role === 'counselor' ? 'Chuyên gia' : 'Người dùng'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${u.email_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className={`text-sm ${u.email_verified ? 'text-green-800' : 'text-yellow-800'}`}>
                          {u.email_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm ${u.is_active ? 'text-green-800' : 'text-red-800'}`}>
                          {u.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(u)} 
                          className="px-3 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors duration-200"
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => toggleActive(u)} 
                          className={`px-3 py-1 text-xs rounded-lg transition-colors duration-200 ${
                            u.is_active 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                        >
                          {u.is_active ? 'Khóa' : 'Mở'}
                        </button>
                        <button 
                          onClick={() => removeUser(u)} 
                          className="px-3 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors duration-200"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination current={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {editingUser ? 'Quản lý thông tin tài khoản' : 'Tạo tài khoản mới'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-180px)]">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Row 1: Name and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                      Họ tên
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="trà đào"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="dao8198@gmail.com"
                      required
                    />
                  </div>
                </div>

                {/* Row 2: Password and Role */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                      </svg>
                      Mật khẩu {editingUser && <span className="text-xs text-gray-500">(để trống nếu không đổi)</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder={editingUser ? "Để trống nếu không đổi" : "••••••"}
                      required={!editingUser}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                      </svg>
                      Vai trò
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="user">Người dùng</option>
                      <option value="counselor">Chuyên gia</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                </div>

                {/* Row 3: Phone and Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="4343434343"
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
                      </svg>
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Email Verification Options */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                    <h4 className="text-sm font-semibold text-blue-800">Tùy chọn xác thực email</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        name="email_verified"
                        checked={formData.email_verified}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                      />
                      <label className="text-sm text-gray-700">
                        {editingUser ? 'Email đã được xác thực' : 'Email đã được xác thực (gửi welcome email)'}
                      </label>
                    </div>

                    {!editingUser && (
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          name="send_welcome_email"
                          checked={formData.send_welcome_email}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
                        />
                        <label className="text-sm text-gray-700">
                          Gửi email xác thực cho người dùng
                        </label>
                      </div>
                    )}
                  </div>

                  {!editingUser && (
                    <div className="mt-4 pt-3 border-t border-blue-200">
                      <h5 className="text-xs font-medium text-blue-800 mb-2">Lưu ý:</h5>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• Nếu chọn "Email đã được xác thực": Người dùng có thể đăng nhập ngay và nhận welcome email</li>
                        <li>• Nếu chọn "Gửi email xác thực": Người dùng cần xác nhận email trước khi đăng nhập</li>
                        <li>• Có thể chọn cả hai tùy chọn</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Account Status Checkbox */}
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <label className="ml-3 text-sm font-medium text-green-800">
                      Tài khoản hoạt động
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                {editingUser ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

