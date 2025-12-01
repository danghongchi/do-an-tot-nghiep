import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import api from '../../services/api';
import AdminPage from './AdminPage';
import { useToast } from '../../components/Toast';
import Pagination from '../../components/Pagination';
import { ChatIcon, ClipboardListIcon, CheckCircleIcon } from '../../components/icons/AdminIcons';

const ITEMS_PER_PAGE = 10;

export default function AdminChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { show } = useToast();

  useEffect(() => {
    loadChats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/chats');
      setChats(res.data || []);
    } catch (err) {
      console.error('Error loading chats:', err);
      show('Không thể tải danh sách chat', { title: 'Lỗi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (appointmentId) => {
    if (!confirm('Xóa tất cả tin nhắn trong cuộc trò chuyện này?')) return;
    try {
      await api.delete(`/admin/chats/${appointmentId}`);
      setChats(prev => prev.filter(c => c.appointment_id !== appointmentId));
      show('Đã xóa cuộc trò chuyện', { title: 'Thành công', type: 'success' });
    } catch (err) {
      console.error('Error deleting chat:', err);
      show('Không thể xóa cuộc trò chuyện', { title: 'Lỗi', type: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'in_progress': return 'yellow';
      case 'completed': return 'blue';
      case 'cancelled': return 'red';
      case 'payment_pending': return 'orange';
      case 'pending': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      case 'payment_pending': return 'Chờ thanh toán';
      case 'pending': return 'Chờ duyệt';
      default: return status;
    }
  };

  const filteredChats = chats.filter(chat => {
    if (filter === 'all') return true;
    return chat.appointment_status === filter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredChats.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredChats.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có tin nhắn';
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <AdminPage title="Quản lý Chat Rooms">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ChatIcon className="w-8 h-8 text-white" />
          </div>
          <div className="text-gray-600 text-lg font-medium">Đang tải danh sách chat...</div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Quản lý Chat Rooms">
      {/* Filter tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'all', label: <span className="flex items-center gap-2"><ClipboardListIcon className="w-4 h-4" /> Tất cả</span>, count: chats.length },
              { key: 'confirmed', label: <span className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Đã xác nhận</span>, count: chats.filter(c => c.appointment_status === 'confirmed').length },
              { key: 'in_progress', label: <span className="flex items-center gap-2"><ChatIcon className="w-4 h-4" /> Đang diễn ra</span>, count: chats.filter(c => c.appointment_status === 'in_progress').length },
              { key: 'completed', label: <span className="flex items-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Hoàn thành</span>, count: chats.filter(c => c.appointment_status === 'completed').length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
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

      {filteredChats.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">💬</span>
          </div>
          <div className="text-gray-500 text-lg">
            {filter === 'all' ? 'Chưa có cuộc trò chuyện nào' : `Chưa có cuộc trò chuyện ${getStatusText(filter).toLowerCase()}`}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Cuộc hẹn
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Bệnh nhân
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Chuyên gia
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Tin nhắn
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Lần cuối
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((chat) => {
                  console.log('Chat data:', chat); // Debug log
                  return (
                  <tr key={chat.appointment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        Cuộc hẹn #{chat.appointment_id}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(chat.appointment_date)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge color="blue">{chat.appointment_type === 'online' ? 'Online' : 'Offline'}</Badge>
                        {chat.is_anonymous && <Badge color="purple">Ẩn danh</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {chat.patient_name || 'Ẩn danh'}
                      </div>
                      {chat.patient_email && (
                        <div className="text-xs text-gray-500">{chat.patient_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {chat.counselor_name || 'Chưa có'}
                      </div>
                      {chat.counselor_email && (
                        <div className="text-xs text-gray-500">{chat.counselor_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getStatusColor(chat.appointment_status)} text={getStatusText(chat.appointment_status)} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {chat.message_count || 0} tin nhắn
                      </div>
                      {chat.unread_count > 0 && (
                        <div className="text-xs text-red-600">
                          ({chat.unread_count} chưa đọc)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(chat.last_message_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Link
                          to={`/admin/chats/${chat.appointment_id}`}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors"
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          onClick={() => deleteChat(chat.appointment_id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                        >
                          Xóa tin nhắn
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredChats.length > ITEMS_PER_PAGE && (
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
    </AdminPage>
  );
}