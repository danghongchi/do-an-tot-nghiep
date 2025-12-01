import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import AdminPage from './AdminPage';

export default function AdminChatDetail() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChatData();
  }, [appointmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChatData = async () => {
    try {
      setLoading(true);
      // Get appointment/chat details
      const chatRes = await api.get(`/admin/chats/${appointmentId}`);
      setAppointment(chatRes.data);
      
      // Get messages
      const messagesRes = await api.get(`/admin/chats/${appointmentId}/messages`);
      setMessages(messagesRes.data || []);
    } catch (err) {
      console.error('Error loading chat data:', err);
      alert('Không thể tải dữ liệu chat');
      navigate('/admin/chats');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <AdminPage title="Chi tiết Chat Room">
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải dữ liệu chat...</div>
        </div>
      </AdminPage>
    );
  }

  if (!appointment) {
    return (
      <AdminPage title="Chi tiết Chat Room">
        <div className="text-center py-12">
          <div className="text-red-500">Không tìm thấy appointment</div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="Chi tiết Chat Room">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết Chat Room</h1>
            <p className="text-gray-600 mt-1">Appointment #{appointment.id}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                appointment.appointment_type === 'online' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {messages.length} tin nhắn
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/chats')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Quay lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointment Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Bệnh nhân</label>
                <p className="text-gray-900">{appointment.patient_name}</p>
                <p className="text-sm text-gray-500">{appointment.patient_email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Chuyên gia</label>
                <p className="text-gray-900">{appointment.counselor_name}</p>
                <p className="text-sm text-gray-500">{appointment.counselor_email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Ngày giờ</label>
                <p className="text-gray-900">{formatDate(appointment.appointment_date)} lúc {appointment.appointment_time}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Chuyên ngành</label>
                <p className="text-gray-900">{appointment.specialty_name || 'N/A'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Loại tư vấn</label>
                <p className="text-gray-900">
                  {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                </p>
              </div>
              
              {appointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                  <p className="text-gray-900 text-sm">{appointment.notes.replace(/^\[ANON=1\]\s*/, '')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md flex flex-col h-[600px]">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Cuộc trò chuyện</h3>
              <p className="text-sm text-gray-500">
                {messages.length > 0 
                  ? `${messages.length} tin nhắn - Cuối cùng: ${formatDateTime(messages[messages.length - 1]?.created_at)}`
                  : 'Chưa có tin nhắn nào'
                }
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Chưa có tin nhắn nào trong cuộc trò chuyện này
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === appointment.patient_id ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === appointment.patient_id
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.sender_name}
                        {message.sender_id === appointment.patient_id ? ' (Bệnh nhân)' : ' (Chuyên gia)'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.sender_id === appointment.patient_id ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        {formatDateTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500 text-center">
                {messages.length > 0 ? (
                  <>
                    Cuộc trò chuyện bắt đầu: {formatDateTime(messages[0]?.created_at)}
                    {messages.length > 1 && (
                      <> - Kết thúc: {formatDateTime(messages[messages.length - 1]?.created_at)}</>
                    )}
                  </>
                ) : (
                  'Chưa có hoạt động chat nào'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}


