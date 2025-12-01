import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function MySchedule(){
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Bulk delete states
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(()=>{
    loadData();
  }, [user]);

  const loadData = async () => {
      try {
      setLoading(true);
      
      // Load schedules using new API
      const sc = await api.get('/counselors/schedules');
        setSchedules(sc.data || []);
      
      // Load appointments using new API
      const ap = await api.get('/counselors/appointments');
        const normalizedAppointments = (ap.data || []).map(a => ({
          ...a,
          appointment_date: a.appointment_date ? a.appointment_date.slice(0, 10) : ''
        }));
        setAppointments(normalizedAppointments);
      } catch (err) {
      console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
  };

  const toggleAvailable = async (s) => {
    try {
      console.log('Toggle called for schedule:', s);
      console.log('Sending API request:', `PUT /counselors/schedules/${s.id}`, { is_available: !s.is_available });
      await api.put(`/counselors/schedules/${s.id}`, { is_available: !s.is_available });
      setSchedules(prev => prev.map(x => x.id === s.id ? {...x, is_available: !x.is_available} : x));
      console.log('Toggle successful');
    } catch (err) {
      alert('Không thể cập nhật lịch');
      console.error('Toggle error:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status });
      setAppointments(prev => prev.map(x => x.id === appointmentId ? {...x, status} : x));
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Không thể cập nhật trạng thái lịch hẹn');
    }
  };

  // Bulk delete functions
  const toggleSelectSchedule = (scheduleId) => {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const toggleSelectAll = () => {
    const currentPageSchedules = getCurrentPageSchedules().map(s => s.id);
    if (selectedSchedules.length === currentPageSchedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(currentPageSchedules);
    }
  };

  const bulkDeleteSchedules = async () => {
    if (selectedSchedules.length === 0) return;
    
    if (!confirm(`Bạn có chắc muốn xóa ${selectedSchedules.length} lịch đã chọn?`)) return;
    
    setIsDeleting(true);
    try {
      await api.delete('/counselors/schedules/bulk', {
        data: { scheduleIds: selectedSchedules }
      });
      setSchedules(prev => prev.filter(s => !selectedSchedules.includes(s.id)));
      setSelectedSchedules([]);
      setCurrentPage(1); // Reset về trang 1 sau khi xóa
      alert('Đã xóa thành công các lịch đã chọn');
    } catch (err) {
      console.error('Error bulk deleting:', err);
      alert(err.response?.data?.message || 'Có lỗi khi xóa lịch');
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination functions
  const getCurrentPageSchedules = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return schedules.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(schedules.length / itemsPerPage);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Xử lý string YYYY-MM-DD từ database để tránh lỗi timezone
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 border border-gray-100 animate-pulse h-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-pulse h-96" />
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-pulse h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-blue-600 p-8 rounded-2xl text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lịch làm việc của tôi
            </h1>
            <p className="text-gray-100 text-xl">Quản lý lịch làm việc và lịch hẹn tư vấn</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm">{schedules.length} khung giờ</span>
              </div>
              <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-sm">{appointments.length} lịch hẹn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-2xl shadow-xl mb-8 border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            Thao tác nhanh
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/counselor/manage-schedule"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Quản lý lịch làm việc
            </Link>
            <button
              onClick={loadData}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schedules */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Khung giờ làm việc
                </h2>
                <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
                  <span className="font-bold text-lg">{schedules.length}</span>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {schedules.length > 0 && (
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSchedules.length === getCurrentPageSchedules().length && getCurrentPageSchedules().length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Chọn tất cả trang này</span>
                    </label>
                    {selectedSchedules.length > 0 && (
                      <span className="text-sm text-gray-600">
                        ({selectedSchedules.length} được chọn)
                      </span>
                    )}
                  </div>
                  {selectedSchedules.length > 0 && (
                    <button
                      onClick={bulkDeleteSchedules}
                      disabled={isDeleting}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang xóa...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa ({selectedSchedules.length})
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          
          <div className="max-h-96 overflow-y-auto">
            {schedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Chưa có khung giờ nào. 
                <Link to="/counselor/manage-schedule" className="text-blue-600 hover:underline ml-1">
                  Thêm lịch làm việc
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {getCurrentPageSchedules().map(schedule => (
                  <div key={schedule.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedSchedules.includes(schedule.id)}
                        onChange={() => toggleSelectSchedule(schedule.id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {formatDate(schedule.date)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {schedule.start_time} - {schedule.end_time}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {schedule.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.is_available ? 'Có sẵn' : 'Không có sẵn'}
                        </span>
                        <button
                          onClick={() => toggleAvailable(schedule)}
                          className={`px-2 py-1 text-xs rounded ${
                            schedule.is_available
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {schedule.is_available ? 'Tắt' : 'Bật'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {schedules.length > itemsPerPage && (
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Hiển thị {Math.min((currentPage - 1) * itemsPerPage + 1, schedules.length)} - {Math.min(currentPage * itemsPerPage, schedules.length)} trên {schedules.length} kết quả
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-gray-700">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

          {/* Appointments */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Lịch hẹn
                </h2>
                <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
                  <span className="font-bold text-lg">{appointments.length}</span>
                </div>
              </div>
            </div>
          
            <div className="max-h-96 overflow-y-auto">
              {appointments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">Chưa có lịch hẹn nào</p>
                  <p className="text-gray-400 text-sm mt-2">Lịch hẹn sẽ xuất hiện ở đây khi bệnh nhân đặt lịch</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {appointments.map(appointment => (
                    <div key={appointment.id} className="p-6 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white font-bold text-sm">
                                {appointment.patient_name?.charAt(0) || 'P'}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">
                                {appointment.patient_name}
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(appointment.appointment_date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {appointment.appointment_time}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  appointment.appointment_type === 'online' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                                </span>
                              </div>
                              {appointment.notes && (
                                <div className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-2 rounded-lg flex items-start gap-2">
                                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  "{appointment.notes.replace(/^\[ANON=1\]\s*/, '')}"
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(appointment.status)}`}>
                            {getStatusLabel(appointment.status)}
                          </span>
                          <div className="flex gap-2">
                            {appointment.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Xác nhận
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc chắn muốn hủy lịch hẹn với ${appointment.patient_name}?`)) {
                                      updateAppointmentStatus(appointment.id, 'cancelled');
                                    }
                                  }}
                                  className="px-3 py-1 text-xs bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Hủy
                                </button>
                              </>
                            )}
                            {appointment.status === 'confirmed' && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Bắt đầu
                              </button>
                            )}
                            {appointment.status === 'in_progress' && (
                              <button
                                onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Hoàn thành
                              </button>
                            )}
                            {appointment.appointment_type === 'online' && appointment.status !== 'cancelled' && (
                              <Link
                                to={`/counselor/chat/${appointment.id}`}
                                className="px-3 py-1 text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Chat
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
