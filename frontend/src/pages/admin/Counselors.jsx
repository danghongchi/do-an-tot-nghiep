import React, { useState, useEffect } from 'react';
import AdminPage from './AdminPage';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { CheckCircleIcon, XCircleIcon, InfoIcon, UsersIcon, ChartBarIcon, UserIcon, TargetIcon, CalendarIcon, CheckIcon, XIcon, SaveIcon, CounselorIcon, CashIcon, BadgeCheckIcon } from '../../components/icons/AdminIcons';

export default function AdminCounselors() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCounselor, setViewingCounselor] = useState(null);
  const [editingCounselor, setEditingCounselor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialties, setSpecialties] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialty_id: '',
    clinic_address: '',
    experience_years: '',
    experience_description: '',
    online_price: '',
    offline_price: '',
    working_hours: '',
    is_available: true
  });

  // Enhanced message function
  const showMessage = (message, options = {}) => {
    const { type = 'info', title = 'Thông báo' } = options;
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const IconComponent = type === 'success' ? CheckCircleIcon : type === 'error' ? XCircleIcon : InfoIcon;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 transform`;
    const iconContainer = document.createElement('span');
    iconContainer.className = 'text-lg';
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="flex items-center gap-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />' : type === 'error' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />'}
        </svg>
        <div>
          <div class="font-semibold">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    alertDiv.appendChild(content);
    
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      alertDiv.style.transform = 'translateY(-100%)';
      setTimeout(() => document.body.removeChild(alertDiv), 300);
    }, 4000);
  };

  useEffect(() => {
    loadCounselors();
    loadSpecialties();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, specialtyFilter, statusFilter]);

  const loadCounselors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/counselors');
      setCounselors(res.data || []);
    } catch (err) {
      console.error('Error loading counselors:', err);
      showMessage('Không thể tải danh sách chuyên gia', { title: 'Lỗi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const res = await api.get('/admin/specialties');
      setSpecialties(res.data || []);
    } catch (err) {
      console.error('Error loading specialties:', err);
    }
  };

  // Filter counselors based on search term, specialty, and status
  const filteredCounselors = counselors.filter(counselor => {
    const matchesSearch = !searchTerm || 
      counselor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counselor.phone?.includes(searchTerm) ||
      counselor.clinic_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = specialtyFilter === 'all' || 
      counselor.specialty_name === specialtyFilter;
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'available' && counselor.is_available) ||
      (statusFilter === 'unavailable' && !counselor.is_available);
    
    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  // Pagination logic
  const pageSize = 10;
  const totalPages = Math.ceil((filteredCounselors?.length || 0) / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = filteredCounselors.slice(startIndex, startIndex + pageSize);

  const handleCreate = () => {
    setEditingCounselor(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      specialty_id: '',
      clinic_address: '',
      experience_years: '',
      experience_description: '',
      online_price: '',
      offline_price: '',
      working_hours: '',
      is_available: true
    });
    setShowModal(true);
  };

  const handleEdit = (counselor) => {
    setEditingCounselor(counselor);
    setFormData({
      full_name: counselor.full_name || '',
      email: counselor.email || '',
      phone: counselor.phone || '',
      specialty_id: counselor.specialty_id || '',
      clinic_address: counselor.clinic_address || '',
      experience_years: counselor.experience_years || '',
      experience_description: counselor.experience_description || '',
      online_price: counselor.online_price || '',
      offline_price: counselor.offline_price || '',
      working_hours: counselor.working_hours || '',
      is_available: counselor.is_available
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCounselor) {
        // Update existing counselor
        const counselorId = editingCounselor.counselor_id || editingCounselor.id;
        await api.put(`/admin/counselors/${counselorId}`, formData);
        showMessage('Cập nhật chuyên gia thành công', { title: 'Thành công', type: 'success' });
      } else {
        // Create new counselor
        await api.post('/admin/counselors', formData);
        showMessage('Tạo chuyên gia thành công', { title: 'Thành công', type: 'success' });
      }
      setShowModal(false);
      loadCounselors();
    } catch (err) {
      console.error('Error saving counselor:', err);
      const action = editingCounselor ? 'cập nhật' : 'tạo';
      showMessage(`Không thể ${action} chuyên gia`, { title: 'Lỗi', type: 'error' });
    }
  };

  const handleDelete = async (counselorId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chuyên gia này?')) return;
    
    try {
      await api.delete(`/admin/counselors/${counselorId}`);
      showMessage('Xóa chuyên gia thành công', { title: 'Thành công', type: 'success' });
      loadCounselors();
    } catch (err) {
      console.error('Error deleting counselor:', err);
      showMessage('Không thể xóa chuyên gia', { title: 'Lỗi', type: 'error' });
    }
  };

  const toggleAvailability = async (counselorId, currentStatus) => {
    try {
      await api.put(`/admin/counselors/${counselorId}`, { is_available: !currentStatus });
      showMessage('Cập nhật trạng thái thành công', { title: 'Thành công', type: 'success' });
      loadCounselors();
    } catch (err) {
      console.error('Error toggling availability:', err);
      showMessage('Không thể cập nhật trạng thái', { title: 'Lỗi', type: 'error' });
    }
  };

  const handleView = (counselor) => {
    setViewingCounselor(counselor);
    setShowViewModal(true);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl || !avatarUrl.trim()) return null;
    
    // If it's already a full URL, return as is
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
      return avatarUrl;
    }
    
    // If it's a relative path, prepend the backend URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove /api suffix if exists
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
  };

  if (loading) {
    return (
      <AdminPage title="👨‍⚕️ Quản lý Chuyên gia">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl text-white">👨‍⚕️</span>
          </div>
          <div className="text-gray-600 font-medium">Đang tải danh sách chuyên gia...</div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Quản lý Chuyên gia">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div class="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-blue-700">Tổng chuyên gia</p>
                <p className="text-3xl font-bold text-blue-900">{counselors.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-green-700">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-900">
                  {counselors.filter(c => c.is_available).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 backdrop-blur-sm rounded-2xl shadow-xl border border-red-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-red-700">Tạm dừng</p>
                <p className="text-3xl font-bold text-red-900">
                  {counselors.filter(c => !c.is_available).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-purple-700">Kinh nghiệm TB</p>
                <p className="text-3xl font-bold text-purple-900">
                  {counselors.length > 0 
                    ? Math.round(counselors.reduce((sum, c) => sum + (c.experience_years || 0), 0) / counselors.length)
                    : '0'
                  } năm
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
                placeholder="Tìm kiếm theo tên, email, địa chỉ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Specialty Filter */}
            <div>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">Tất cả chuyên ngành</option>
                {specialties.map(specialty => (
                  <option key={specialty.id} value={specialty.name}>
                    {specialty.name}
                  </option>
                ))}
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
                <option value="available">Đang hoạt động</option>
                <option value="unavailable">Tạm dừng</option>
              </select>
            </div>
          </div>

          {/* Filter Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Hiển thị {pageItems.length} trên trang {currentPage} trong tổng số {filteredCounselors.length} chuyên gia
              {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
            </span>
            {(searchTerm || specialtyFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSpecialtyFilter('all');
                  setStatusFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Counselors List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách chuyên gia</h3>
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm chuyên gia
            </button>
          </div>

          {filteredCounselors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">👨‍⚕️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {counselors.length === 0 ? 'Chưa có chuyên gia nào' : 'Không tìm thấy chuyên gia'}
              </h3>
              <p className="text-gray-500">
                {counselors.length === 0 ? 'Các chuyên gia sẽ xuất hiện ở đây sau khi đăng ký.' : 'Thử thay đổi tiêu chí tìm kiếm.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chuyên gia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chuyên ngành
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kinh nghiệm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá dịch vụ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pageItems.map((counselor, index) => (
                    <tr key={counselor.counselor_id || `counselor-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 relative">
                            {getAvatarUrl(counselor.avatar_url) ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-md"
                                src={getAvatarUrl(counselor.avatar_url)}
                                alt={counselor.full_name}
                                onError={(e) => {
                                  console.log('Avatar load error:', counselor.avatar_url);
                                  e.target.style.display = 'none';
                                  e.target.parentNode.querySelector('.fallback-avatar').style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`fallback-avatar h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md ${getAvatarUrl(counselor.avatar_url) ? 'hidden' : ''}`}>
                              <span className="text-white font-medium text-sm">
                                {counselor.full_name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {counselor.full_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {counselor.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{counselor.specialty_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{counselor.experience_years} năm</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div key="online">Online: {formatPrice(counselor.online_price)}</div>
                          <div key="offline">Offline: {formatPrice(counselor.offline_price)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleAvailability(counselor.counselor_id, counselor.is_available)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            counselor.is_available
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {counselor.is_available ? 'Hoạt động' : 'Tạm dừng'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(counselor)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handleEdit(counselor)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(counselor.counselor_id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
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
          )}
          
          {/* Pagination */}
          {filteredCounselors.length > pageSize && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <Pagination current={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
            </div>
          )}
        </div>

        {/* Enhanced Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">{editingCounselor ? '✏️' : '➕'}</span>
                  {editingCounselor ? 'Chỉnh sửa thông tin chuyên gia' : 'Thêm chuyên gia mới'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic info fields - show for both create and edit */}
                <div className="space-y-4 bg-blue-50 rounded-xl p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" /> Họ và tên *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name || ''}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Nhập họ và tên..."
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-700 mb-2 block">
                        📧 Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Nhập email..."
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-blue-700 mb-2 block">
                        📱 Số điện thoại
                      </label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Nhập số điện thoại..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <TargetIcon className="w-4 h-4" /> Chuyên ngành
                      </label>
                      <select
                        value={formData.specialty_id || ''}
                        onChange={(e) => setFormData({...formData, specialty_id: e.target.value})}
                        className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Chọn chuyên ngành</option>
                        {specialties.map(specialty => (
                          <option key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    🏥 Địa chỉ phòng khám
                  </label>
                  <textarea
                    value={formData.clinic_address}
                    onChange={(e) => setFormData({...formData, clinic_address: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    placeholder="Nhập địa chỉ phòng khám..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" /> Số năm kinh nghiệm
                    </label>
                    <input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                      className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 5"
                      min="0"
                    />
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                      ⏰ Giờ làm việc
                    </label>
                    <input
                      type="text"
                      value={formData.working_hours}
                      onChange={(e) => setFormData({...formData, working_hours: e.target.value})}
                      className="w-full px-4 py-3 border border-green-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: Thứ 2-6, 8:00-17:00"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <label className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                    📝 Mô tả kinh nghiệm
                  </label>
                  <textarea
                    value={formData.experience_description}
                    onChange={(e) => setFormData({...formData, experience_description: e.target.value})}
                    className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    placeholder="Mô tả về kinh nghiệm và chuyên môn..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-orange-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                      💻 Giá tư vấn online (VND)
                    </label>
                    <input
                      type="number"
                      value={formData.online_price}
                      onChange={(e) => setFormData({...formData, online_price: e.target.value})}
                      className="w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 300000"
                      min="0"
                    />
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <label className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                      🏢 Giá tư vấn offline (VND)
                    </label>
                    <input
                      type="number"
                      value={formData.offline_price}
                      onChange={(e) => setFormData({...formData, offline_price: e.target.value})}
                      className="w-full px-4 py-3 border border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      placeholder="VD: 500000"
                      min="0"
                    />
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                      className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <label className="ml-3 text-sm font-semibold text-green-700 flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" /> Chuyên gia đang hoạt động
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <XIcon className="w-4 h-4" /> Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    {editingCounselor ? (
                      <><SaveIcon className="w-4 h-4" /> Cập nhật</>
                    ) : (
                      <><CheckIcon className="w-4 h-4" /> Tạo mới</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingCounselor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white">👁️</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Thông tin chuyên gia</h3>
                    <p className="text-blue-100 text-sm">Xem chi tiết thông tin chuyên gia</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white/80 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {getAvatarUrl(viewingCounselor.avatar_url) ? (
                        <img 
                          className="h-24 w-24 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                          src={getAvatarUrl(viewingCounselor.avatar_url)}
                          alt={viewingCounselor.full_name}
                          onError={(e) => {
                            console.log('Modal avatar load error:', viewingCounselor.avatar_url);
                            e.target.style.display = 'none';
                            e.target.parentNode.querySelector('.fallback-avatar-large').style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`fallback-avatar-large h-24 w-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-blue-200 ${getAvatarUrl(viewingCounselor.avatar_url) ? 'hidden' : ''}`}>
                        <span className="text-white font-bold text-2xl">
                          {viewingCounselor.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-blue-500" /> Thông tin cơ bản
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Họ tên</label>
                        <p className="text-sm text-gray-900 mt-1">{viewingCounselor.full_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900 mt-1">{viewingCounselor.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Số điện thoại</label>
                        <p className="text-sm text-gray-900 mt-1">{viewingCounselor.phone || 'Chưa cập nhật'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Giới tính</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewingCounselor.gender === 'male' ? 'Nam' : 
                           viewingCounselor.gender === 'female' ? 'Nữ' : 
                           viewingCounselor.gender === 'other' ? 'Khác' : 'Chưa xác định'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-blue-500">🎓</span> Thông tin chuyên môn
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Chuyên ngành</label>
                        <p className="text-sm text-blue-900 mt-1 font-medium">{viewingCounselor.specialty_name || 'Chưa xác định'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Kinh nghiệm</label>
                        <p className="text-sm text-blue-900 mt-1 font-medium">{viewingCounselor.experience_years} năm</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600">Mô tả kinh nghiệm</label>
                        <p className="text-sm text-gray-900 mt-1 bg-white p-3 rounded-lg">
                          {viewingCounselor.experience_description && viewingCounselor.experience_description.trim() 
                            ? viewingCounselor.experience_description 
                            : 'Chưa có mô tả kinh nghiệm'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service Info */}
                  <div className="bg-green-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CashIcon className="w-5 h-5 text-green-500" /> Thông tin dịch vụ
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Giá online</label>
                        <p className="text-sm text-green-900 mt-1 font-medium">{formatPrice(viewingCounselor.online_price)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Giá offline</label>
                        <p className="text-sm text-green-900 mt-1 font-medium">{formatPrice(viewingCounselor.offline_price)}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600">Địa chỉ phòng khám</label>
                        <p className="text-sm text-gray-900 mt-1 bg-white p-3 rounded-lg">
                          {viewingCounselor.clinic_address && viewingCounselor.clinic_address.trim()
                            ? viewingCounselor.clinic_address 
                            : 'Chưa cập nhật địa chỉ phòng khám'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-600">Giờ làm việc</label>
                        <p className="text-sm text-gray-900 mt-1 bg-white p-3 rounded-lg whitespace-pre-line">
                          {viewingCounselor.working_hours && viewingCounselor.working_hours.trim()
                            ? viewingCounselor.working_hours 
                            : 'Chưa cập nhật giờ làm việc'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ChartBarIcon className="w-5 h-5 text-yellow-500" /> Trạng thái
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tình trạng hoạt động</label>
                        <div className="flex items-center mt-2">
                          <div className={`w-3 h-3 rounded-full mr-2 ${viewingCounselor.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-sm font-medium ${viewingCounselor.is_available ? 'text-green-800' : 'text-red-800'}`}>
                            {viewingCounselor.is_available ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ngày tham gia</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {viewingCounselor.created_at ? new Date(viewingCounselor.created_at).toLocaleDateString('vi-VN') : 'Không xác định'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}