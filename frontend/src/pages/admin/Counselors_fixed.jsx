import React, { useState, useEffect } from 'react';
import AdminPage from './AdminPage';
import api from '../../services/api';

export default function AdminCounselors() {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCounselor, setEditingCounselor] = useState(null);
  const [formData, setFormData] = useState({
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
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 transform`;
    alertDiv.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-lg">${emoji}</span>
        <div>
          <div class="font-semibold">${title}</div>
          <div class="text-sm opacity-90">${message}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    setTimeout(() => {
      alertDiv.style.opacity = '0';
      alertDiv.style.transform = 'translateY(-100%)';
      setTimeout(() => document.body.removeChild(alertDiv), 300);
    }, 4000);
  };

  useEffect(() => {
    loadCounselors();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleEdit = (counselor) => {
    setEditingCounselor(counselor);
    setFormData({
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
      const counselorId = editingCounselor.counselor_id || editingCounselor.id;
      await api.put(`/admin/counselors/${counselorId}`, formData);
      showMessage('Cập nhật chuyên gia thành công', { title: 'Thành công', type: 'success' });
      setShowModal(false);
      loadCounselors();
    } catch (err) {
      console.error('Error updating counselor:', err);
      showMessage('Không thể cập nhật chuyên gia', { title: 'Lỗi', type: 'error' });
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(price);
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
    <AdminPage title="👨‍⚕️ Quản lý Chuyên gia">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl text-white">👨‍⚕️</span>
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
                <span className="text-2xl text-white">✅</span>
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
                <span className="text-2xl text-white">⏸️</span>
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
                <span className="text-2xl text-white">📊</span>
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

        {/* Counselors List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách chuyên gia</h3>
          </div>

          {counselors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">👨‍⚕️</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có chuyên gia nào</h3>
              <p className="text-gray-500">Các chuyên gia sẽ xuất hiện ở đây sau khi đăng ký.</p>
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
                  {counselors.map((counselor, index) => (
                    <tr key={counselor.counselor_id || `counselor-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {counselor.avatar_url ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover"
                                src={counselor.avatar_url}
                                alt={counselor.full_name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center ${counselor.avatar_url ? 'hidden' : ''}`}>
                              <span className="text-white font-medium text-sm">
                                {counselor.full_name?.charAt(0) || '?'}
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
                            onClick={() => handleEdit(counselor)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                          >
                            ✏️ Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(counselor.counselor_id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enhanced Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-white/20 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">✏️</span>
                  Chỉnh sửa thông tin chuyên gia
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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
                      📅 Số năm kinh nghiệm
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
                      ✅ Chuyên gia đang hoạt động
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    ❌ Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    💾 Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}