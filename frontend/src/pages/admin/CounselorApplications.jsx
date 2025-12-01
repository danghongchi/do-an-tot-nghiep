import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import api from '../../services/api';
import AdminPage from './AdminPage';
import { useToast } from '../../components/Toast';
import Pagination from '../../components/Pagination';
import { ClipboardListIcon, ClockIcon, CheckCircleIcon, XCircleIcon, DocumentIcon, CheckIcon, XIcon } from '../../components/icons/AdminIcons';

const ITEMS_PER_PAGE = 10;

export default function AdminCounselorApplications() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_review');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModal, setViewModal] = useState({ show: false, app: null });
  const { show } = useToast();

  useEffect(() => {
    loadApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/counselor-applications');
      setList(res.data || []);
    } catch (err) {
      console.error('Error loading applications:', err);
      show('Không thể tải danh sách hồ sơ', { title: 'Lỗi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (app) => {
    if (!confirm(`Duyệt hồ sơ của ${app.full_name}?`)) return;
    try {
      await api.put(`/admin/counselor-applications/${app.id}/approve`);
      setList(prev => prev.map(x => x.id === app.id ? {...x, status: 'approved'} : x));
      show('Đã duyệt hồ sơ thành công', { title: 'Thành công', type: 'success' });
    } catch (err) {
      console.error('Error approving application:', err);
      show('Không thể duyệt hồ sơ', { title: 'Lỗi', type: 'error' });
    }
  };

  const handleReject = async (app) => {
    if (!confirm(`Từ chối hồ sơ của ${app.full_name}?`)) return;
    try {
      await api.put(`/admin/counselor-applications/${app.id}/reject`);
      setList(prev => prev.map(x => x.id === app.id ? {...x, status: 'rejected'} : x));
      show('Đã từ chối hồ sơ', { title: 'Thành công', type: 'success' });
    } catch (err) {
      console.error('Error rejecting application:', err);
      show('Không thể từ chối hồ sơ', { title: 'Lỗi', type: 'error' });
    }
  };

  const handleDelete = async (app) => {
    if (!confirm(`Xóa hồ sơ của ${app.full_name}?`)) return;
    try {
      await api.delete(`/admin/counselor-applications/${app.id}`);
      setList(prev => prev.filter(x => x.id !== app.id));
      show('Đã xóa hồ sơ', { title: 'Thành công', type: 'success' });
    } catch (err) {
      console.error('Error deleting application:', err);
      if (err.response?.status === 404) {
        show('Route xóa hồ sơ chưa được cài đặt. Vui lòng restart backend server.', { title: 'Lỗi', type: 'error' });
      } else {
        show('Không thể xóa hồ sơ', { title: 'Lỗi', type: 'error' });
      }
    }
  };

  const handleView = (app) => {
    setViewModal({ show: true, app });
  };

  const filteredList = list.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending_review': return 'Chờ duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return status;
    }
  };

  const renderApplicationRow = (app) => (
    <tr key={app.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {app.full_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{app.full_name}</div>
            <div className="text-sm text-gray-500">{app.email}</div>
            <div className="text-xs text-gray-400">
              {app.phone || 'Chưa có SĐT'} • {app.gender === 'male' ? 'Nam' : app.gender === 'female' ? 'Nữ' : 'Khác'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{app.specialty_name || 'Chưa chọn'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{app.experience_years || 0} năm</div>
        {app.experience_description && (
          <div className="text-xs text-gray-500 max-w-xs truncate">
            {app.experience_description}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge color={getStatusColor(app.status)} text={getStatusText(app.status)} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(app.created_at).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleView(app)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors text-xs"
          >
            Xem
          </button>
          {app.status === 'pending_review' && (
            <>
              <button
                onClick={() => handleApprove(app)}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors text-xs"
              >
                Duyệt
              </button>
              <button
                onClick={() => handleReject(app)}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition-colors text-xs"
              >
                Từ chối
              </button>
            </>
          )}
          <button
            onClick={() => handleDelete(app)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition-colors text-xs"
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <AdminPage title="🎓 Duyệt hồ sơ chuyên gia" subtitle="Duyệt và quản lý các hồ sơ ứng tuyển thành chuyên gia">
      {/* Filter tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: <span className="flex items-center gap-2"><ClipboardListIcon className="w-4 h-4" /> Tất cả</span>, count: list.length },
              { key: 'pending_review', label: <span className="flex items-center gap-2"><ClockIcon className="w-4 h-4" /> Chờ duyệt</span>, count: list.filter(x => x.status === 'pending_review').length },
              { key: 'approved', label: <span className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Đã duyệt</span>, count: list.filter(x => x.status === 'approved').length },
              { key: 'rejected', label: <span className="flex items-center gap-2"><XCircleIcon className="w-4 h-4" /> Từ chối</span>, count: list.filter(x => x.status === 'rejected').length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl text-white">🎓</span>
          </div>
          <div className="text-gray-600 text-lg font-medium">Đang tải danh sách hồ sơ...</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">🎓</span>
          </div>
          <div className="text-gray-500 text-lg">
            {activeTab === 'all' ? 'Chưa có hồ sơ nào' : `Chưa có hồ sơ ${getStatusText(activeTab).toLowerCase()}`}
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ỨNG VIÊN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CHUYÊN NGÀNH
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KINH NGHIỆM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    TRẠNG THÁI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NGÀY NỘP
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map(renderApplicationRow)}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredList.length > ITEMS_PER_PAGE && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Pagination
                current={currentPage}
                totalPages={totalPages}
                onChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* View Modal */}
      {viewModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Chi tiết hồ sơ ứng tuyển</h2>
                  <p className="text-gray-600 mt-1">Thông tin đầy đủ của ứng viên</p>
                </div>
                <button
                  onClick={() => setViewModal({ show: false, app: null })}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Thông tin cơ bản</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <p className="text-gray-900 font-medium">{viewModal.app?.full_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900">{viewModal.app?.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <p className="text-gray-900">{viewModal.app?.phone || 'Chưa có thông tin'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    <p className="text-gray-900">
                      {viewModal.app?.gender === 'male' ? 'Nam' : 
                       viewModal.app?.gender === 'female' ? 'Nữ' : 'Khác'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                    <Badge 
                      color={getStatusColor(viewModal.app?.status)} 
                      text={getStatusText(viewModal.app?.status)} 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nộp hồ sơ</label>
                    <p className="text-gray-900">
                      {viewModal.app?.created_at ? 
                        new Date(viewModal.app.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Chưa có thông tin'
                      }
                    </p>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Thông tin chuyên môn</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên ngành</label>
                    <p className="text-gray-900 font-medium">{viewModal.app?.specialty_name || 'Chưa có thông tin'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số năm kinh nghiệm</label>
                    <p className="text-gray-900">{viewModal.app?.experience_years || 0} năm</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ phòng khám</label>
                    <p className="text-gray-900">{viewModal.app?.clinic_address || 'Chưa có thông tin'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giờ làm việc</label>
                    <p className="text-gray-900">{viewModal.app?.working_hours || 'Chưa có thông tin'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phí tư vấn</label>
                    <div className="text-gray-900">
                      {viewModal.app?.online_price || viewModal.app?.offline_price ? (
                        <div className="space-y-1">
                          {viewModal.app?.online_price && (
                            <div>💻 Online: {viewModal.app.online_price.toLocaleString('vi-VN')} VNĐ</div>
                          )}
                          {viewModal.app?.offline_price && (
                            <div>🏥 Offline: {viewModal.app.offline_price.toLocaleString('vi-VN')} VNĐ</div>
                          )}
                        </div>
                      ) : (
                        'Chưa có thông tin'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center gap-2"><DocumentIcon className="w-5 h-5" /> Tài liệu xác minh</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Qualification Documents */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><DocumentIcon className="w-4 h-4" /> Bằng cấp/Chứng chỉ</h4>
                    {viewModal.app?.qualification_documents ? (
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const docs = JSON.parse(viewModal.app.qualification_documents);
                            return docs.map((doc, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-blue-600">📄</span>
                                <a 
                                  href={`http://localhost:5000/uploads/${doc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                  title={doc}
                                >
                                  {doc.length > 30 ? `${doc.substring(0, 30)}...` : doc}
                                </a>
                              </div>
                            ));
                          } catch {
                            return <p className="text-red-500 text-sm">Lỗi định dạng tài liệu</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có tài liệu</p>
                    )}
                  </div>

                  {/* Identity Documents */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">🆔 CMND/CCCD</h4>
                    {viewModal.app?.identity_documents ? (
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const docs = JSON.parse(viewModal.app.identity_documents);
                            return docs.map((doc, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-green-600">📄</span>
                                <a 
                                  href={`http://localhost:5000/uploads/${doc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                  title={doc}
                                >
                                  {doc.length > 30 ? `${doc.substring(0, 30)}...` : doc}
                                </a>
                              </div>
                            ));
                          } catch {
                            return <p className="text-red-500 text-sm">Lỗi định dạng tài liệu</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có tài liệu</p>
                    )}
                  </div>

                  {/* License Documents */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><DocumentIcon className="w-4 h-4" /> Giấy phép hành nghề</h4>
                    {viewModal.app?.license_documents ? (
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const docs = JSON.parse(viewModal.app.license_documents);
                            return docs.map((doc, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-purple-600">📄</span>
                                <a 
                                  href={`http://localhost:5000/uploads/${doc}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                                  title={doc}
                                >
                                  {doc.length > 30 ? `${doc.substring(0, 30)}...` : doc}
                                </a>
                              </div>
                            ));
                          } catch {
                            return <p className="text-red-500 text-sm">Lỗi định dạng tài liệu</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Chưa có tài liệu</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Experience Description */}
              {viewModal.app?.experience_description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Mô tả kinh nghiệm</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewModal.app.experience_description}</p>
                  </div>
                </div>
              )}

              {/* Bio */}
              {viewModal.app?.bio && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Giới thiệu bản thân</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{viewModal.app.bio}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setViewModal({ show: false, app: null })}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Đóng
                  </button>
                  {viewModal.app?.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => {
                          handleApprove(viewModal.app);
                          setViewModal({ show: false, app: null });
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center gap-2"
                      >
                        <CheckIcon className="w-4 h-4" /> Duyệt hồ sơ
                      </button>
                      <button
                        onClick={() => {
                          handleReject(viewModal.app);
                          setViewModal({ show: false, app: null });
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium flex items-center gap-2"
                      >
                        <XIcon className="w-4 h-4" /> Từ chối hồ sơ
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}