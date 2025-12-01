import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import UserPage from '../../components/UserPage';
import { useSocket } from '../../contexts/SocketContext';

export default function MyAppointments(){
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 5;
  const [reviewModal, setReviewModal] = useState({ open: false, appointment: null, rating: 5, comment: '' });

  const appointmentIds = useMemo(() => appointments.map(a => a.id), [appointments]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/patient/appointments');
        setAppointments(res.data || []);
      } catch (err) {
        console.error('Error loading appointments:', err);
        alert('Không thể tải danh sách lịch hẹn');
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // Join socket rooms for each appointment and listen for status updates
  useEffect(() => {
    if (!socket || !isConnected || appointmentIds.length === 0) return;

    try {
      appointmentIds.forEach(id => socket.emit('join-room', id));
    } catch (e) {
      console.error('Join rooms error:', e);
    }

    const handleAppointmentUpdate = (update) => {
      if (!update || !update.appointmentId) return;
      const id = Number(update.appointmentId);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: update.status || a.status } : a));
    };

    socket.on('appointment_update', handleAppointmentUpdate);

    return () => {
      socket.off('appointment_update', handleAppointmentUpdate);
    };
  }, [socket, isConnected, appointmentIds]);

  const cancelAppointment = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy lịch này?')) return;
    try {
      await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
      setAppointments(prev => prev.map(a => a.id === id ? {...a, status:'cancelled'} : a));
      alert('Hủy lịch hẹn thành công');
    } catch (err) {
      alert('Hủy không thành công: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const deleteAppointment = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa lịch hẹn này? Hành động không thể hoàn tác.')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a.id !== id));
      alert('Xóa lịch hẹn thành công');
    } catch (err) {
      alert('Xóa không thành công: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  // Review helpers
  const openReviewModal = (appointment) => {
    setReviewModal({ open: true, appointment, rating: 5, comment: '' });
  };

  const closeReviewModal = () => {
    setReviewModal(prev => ({ ...prev, open: false }));
  };

  const submitReview = async () => {
    try {
      const { appointment, rating, comment } = reviewModal;
      if (!appointment) return;
      if (!(rating >= 1 && rating <= 5)) {
        alert('Vui lòng chọn điểm từ 1 đến 5');
        return;
      }
      await api.post('/reviews', {
        appointment_id: appointment.id,
        rating: Number(rating),
        comment: comment || ''
      });
      setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, has_review: 1 } : a));
      alert('Gửi đánh giá thành công');
      closeReviewModal();
    } catch (err) {
      alert('Không thể gửi đánh giá: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-cyan-100 text-cyan-800';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800';
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

  const filteredAppointments = appointments.filter(appointment => {
    if (filter === 'all') return true;
    return appointment.status === filter;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const endIndex = startIndex + appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <UserPage title="Lịch hẹn của tôi">
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </UserPage>
    );
  }

  return (
    <UserPage title="">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl shadow-lg p-4 mb-4 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Lịch hẹn của tôi</h1>
              <p className="text-cyan-50 text-xs">Quản lý và theo dõi các buổi tư vấn của bạn</p>
            </div>
          </div>
          <Link 
            to="/patient/counselors" 
            className="inline-flex items-center gap-2 bg-white text-cyan-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-cyan-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đặt lịch mới
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 mb-4">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ xác nhận' },
            { key: 'confirmed', label: 'Đã xác nhận' },
            { key: 'completed', label: 'Hoàn thành' },
            { key: 'cancelled', label: 'Đã hủy' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`flex-1 min-w-[100px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow border border-dashed border-gray-300 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {filter === 'all' ? 'Chưa có lịch hẹn nào' : `Không có lịch hẹn "${getStatusText(filter)}"`}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {filter === 'all' ? 'Hãy đặt lịch tư vấn với chuyên gia' : 'Thử chọn bộ lọc khác'}
          </p>
          {filter === 'all' && (
            <Link 
              to="/patient/counselors" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Đặt lịch ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Results counter */}
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <span className="text-xs font-medium text-gray-700">
              Hiển thị <span className="text-cyan-600 font-bold">{startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)}</span> / <span className="text-cyan-600 font-bold">{filteredAppointments.length}</span> lịch hẹn
            </span>
          </div>
          
          {currentAppointments.map(appointment => (
            <div key={appointment.id} className="group bg-white rounded-xl shadow border border-gray-200 hover:border-cyan-300 hover:shadow-lg transition-all overflow-hidden">
              {/* Status bar */}
              <div className={`h-1 ${
                appointment.status === 'pending' ? 'bg-gradient-to-r from-orange-400 to-yellow-500' :
                appointment.status === 'confirmed' ? 'bg-gradient-to-r from-cyan-400 to-blue-500' :
                appointment.status === 'in_progress' ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                appointment.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                'bg-gradient-to-r from-gray-400 to-gray-500'
              }`} />
              
              <div className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {appointment.counselor_name?.charAt(0) || 'C'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                          {appointment.counselor_name || 'Chuyên gia'}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(appointment.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-semibold">{formatDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">{appointment.appointment_time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          appointment.appointment_type === 'online' 
                            ? 'bg-cyan-100 text-cyan-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                        </span>
                      </div>
                      {appointment.specialty_name && (
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <svg className="w-4 h-4 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span>{appointment.specialty_name}</span>
                        </div>
                      )}
                    </div>
                    
                    {appointment.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-700 flex items-start gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                          <span className="flex-1">{appointment.notes.replace(/^\[ANON=1\]\s*/, '')}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 lg:min-w-[100px]">
                    {appointment.appointment_type === 'online' && appointment.status === 'in_progress' && (
                      <Link
                        to={`/patient/chat/${appointment.id}`}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-xs font-semibold text-center"
                      >
                        Tham gia
                      </Link>
                    )}
                    
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs font-semibold"
                      >
                        Hủy lịch
                      </button>
                    )}

                    {(appointment.status === 'pending' || appointment.status === 'cancelled' || appointment.status === 'completed') && (
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all text-xs font-semibold"
                      >
                        Xóa
                      </button>
                    )}
                    
                    {appointment.status === 'completed' && !appointment.has_review && (
                      <button
                        onClick={() => openReviewModal(appointment)}
                        className="px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all text-xs font-semibold"
                      >
                        Đánh giá
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-4 bg-white p-2.5 rounded-xl shadow border border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                }`}
              >
                ← Trước
              </button>
              
              <div className="flex gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === pageNumber
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700'
                }`}
              >
                Sau →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Đánh giá chuyên gia</h3>
                  <p className="text-yellow-50 text-sm">Chia sẻ trải nghiệm của bạn</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  Lịch hẹn {formatDate(reviewModal.appointment?.appointment_date)} lúc {reviewModal.appointment?.appointment_time}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Đánh giá của bạn:</label>
                <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setReviewModal(prev => ({ ...prev, rating: n }))}
                      className={`text-4xl transition-all transform hover:scale-125 ${reviewModal.rating >= n ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-300'}`}
                      aria-label={`Chấm ${n} sao`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center mt-2 text-sm font-bold text-gray-700">{reviewModal.rating}/5 sao</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Nhận xét của bạn:</label>
                <textarea
                  value={reviewModal.comment}
                  onChange={e => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  placeholder="Chia sẻ cảm nhận của bạn về buổi tư vấn..."
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={closeReviewModal} 
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all"
                >
                  Hủy
                </button>
                <button 
                  onClick={submitReview} 
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Gửi đánh giá
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserPage>
  );
}
