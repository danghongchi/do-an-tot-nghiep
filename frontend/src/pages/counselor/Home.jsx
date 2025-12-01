import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function CounselorHome() {
  const { user } = useAuth();
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/counselors/appointments');
      const data = Array.isArray(res.data) ? res.data : [];
      const today = new Date().toISOString().slice(0, 10);
      
      // Normalize appointment dates to YYYY-MM-DD format
      const normalizedData = data.map(a => ({
        ...a,
        appointment_date: a.appointment_date ? a.appointment_date.slice(0, 10) : ''
      }));
      
      console.log('Today:', today);
      console.log('All appointments:', normalizedData);
      
      setTodayAppointments(normalizedData.filter(a => a.appointment_date === today));
      setUpcoming(normalizedData.filter(a => a.appointment_date >= today).slice(0, 10));
    } catch (err) {
      console.error('Error loading appointments:', err);
      setTodayAppointments([]);
      setUpcoming([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status });
      loadData();
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Không thể cập nhật trạng thái lịch hẹn');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Xử lý string YYYY-MM-DD từ database để tránh lỗi timezone
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const statusClass = (s) => {
    switch (s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusLabel = (s) => {
    switch (s) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang diễn ra';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return s;
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12 text-gray-500">Đang tải thông tin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section with Stats */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-600 via-gray-600 to-blue-600 p-8 rounded-2xl text-white mb-8 shadow-xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">Xin chào, {user?.full_name || 'Chuyên gia'}</h1>
                <p className="text-gray-100 text-lg mb-4">Chào mừng đến với hệ thống quản lý tư vấn</p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/30">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Hôm nay: {new Date().toLocaleDateString('vi-VN')}
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/30">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {todayAppointments.length} lịch hẹn
                  </div>
                  <div className="flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-sm border border-white/30">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {upcoming.length} sắp tới
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 lg:mt-0 lg:ml-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{todayAppointments.filter(a => a.status === 'completed').length}</div>
                    <div className="text-xs text-gray-200">Hoàn thành</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{todayAppointments.filter(a => a.status === 'pending').length}</div>
                    <div className="text-xs text-gray-200">Chờ xác nhận</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{todayAppointments.filter(a => a.appointment_type === 'online').length}</div>
                    <div className="text-xs text-gray-200">Trực tuyến</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{todayAppointments.filter(a => a.appointment_type === 'offline').length}</div>
                    <div className="text-xs text-gray-200">Tại phòng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/counselor/manage-schedule" className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-slate-400 hover:border-slate-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Quản lý lịch</h3>
              <p className="text-gray-600 text-sm">Tạo và quản lý lịch làm việc</p>
            </div>
          </Link>

          <Link to="/counselor/schedule" className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-emerald-400 hover:border-emerald-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Lịch hẹn</h3>
              <p className="text-gray-600 text-sm">Xem và quản lý lịch hẹn</p>
            </div>
          </Link>

          <Link to="/counselor/edit" className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-indigo-400 hover:border-indigo-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Hồ sơ cá nhân</h3>
              <p className="text-gray-600 text-sm">Chỉnh sửa thông tin hồ sơ</p>
            </div>
          </Link>

          <Link to="/counselor/schedule?type=online" className="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border-l-4 border-amber-400 hover:border-amber-500">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">Lịch hẹn tư vấn trực tuyến</h3>
              <p className="text-gray-600 text-sm">Tư vấn trực tuyến</p>
            </div>
          </Link>
        </div>

        {/* Today's Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">Lịch hôm nay</h2>
              <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-lg">{todayAppointments.length}</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {todayAppointments.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Không có lịch hẹn hôm nay</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {todayAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-sky-50 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-lg">{appointment.patient_name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span>{formatDate(appointment.appointment_date)}</span>
                            <span>• {appointment.appointment_time}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.appointment_type === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                            </span>
                          </div>
                          {appointment.notes && (
                            <div className="text-sm text-gray-600 mt-2 italic bg-gray-50 p-2 rounded-lg">"{appointment.notes.replace(/^\[ANON=1\]\s*/, '')}"</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${statusClass(appointment.status)}`}>
                            {statusLabel(appointment.status)}
                          </span>
                          <div className="flex gap-2">
                            {appointment.status === 'pending' && (
                              <button onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')} className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Xác nhận</button>
                            )}
                            {appointment.status === 'confirmed' && (
                              <button onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Bắt đầu</button>
                            )}
                            {appointment.appointment_type === 'online' && appointment.status === 'in_progress' && (
                              <Link to={`/counselor/chat/${appointment.id}`} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Vào chat</Link>
                            )}
                            {appointment.appointment_type === 'offline' && appointment.status === 'in_progress' && (
                              <button onClick={() => updateAppointmentStatus(appointment.id, 'completed')} className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Hoàn thành</button>
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

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white flex items-center justify-between">
              <h2 className="text-2xl font-bold">Lịch sắp tới</h2>
              <div className="bg-white/20 rounded-full px-4 py-2 font-bold text-lg">{upcoming.length}</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {upcoming.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Không có lịch hẹn sắp tới</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcoming.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 text-lg">{appointment.patient_name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <span>{formatDate(appointment.appointment_date)}</span>
                            <span>• {appointment.appointment_time}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${appointment.appointment_type === 'online' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {appointment.appointment_type === 'online' ? 'Trực tuyến' : 'Tại phòng khám'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${statusClass(appointment.status)}`}>
                            {statusLabel(appointment.status)}
                          </span>
                          <div className="flex gap-2">
                            {appointment.status === 'confirmed' && (
                              <button onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Bắt đầu</button>
                            )}
                            {appointment.status === 'in_progress' && (
                              <button onClick={() => updateAppointmentStatus(appointment.id, 'completed')} className="px-3 py-1 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Hoàn thành</button>
                            )}
                            {appointment.appointment_type === 'online' && (
                              <Link to={`/counselor/chat/${appointment.id}`} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Vào chat</Link>
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
