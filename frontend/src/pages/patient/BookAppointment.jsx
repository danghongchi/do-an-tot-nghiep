import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import UserPage from '../../components/UserPage';
import { useToast } from '../../components/Toast';

export default function BookAppointment() {
  const { counselorId } = useParams();
  const { user } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  
  const [counselor, setCounselor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('online');
  const [notes, setNotes] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    // Kiểm tra email verification ngay khi vào trang
    if (user && !user.email_verified) {
      show(
        'Vui lòng xác thực email trước khi đặt lịch tư vấn. Chúng tôi đã gửi email xác thực đến địa chỉ email của bạn.',
        { 
          title: 'Cần xác thực email', 
          type: 'warning',
          duration: 6000
        }
      );
      navigate('/patient/counselors');
      return;
    }

    const loadCounselor = async () => {
      try {
        const response = await api.get(`/counselors/${counselorId}`);
        const data = Array.isArray(response.data) ? response.data[0] : response.data;
        setCounselor(data || null);
      } catch (err) {
        console.error('Error loading counselor:', err);
        alert('Không thể tải thông tin chuyên gia');
        navigate('/patient/counselors');
      } finally {
        setLoading(false);
      }
    };

    if (counselorId) {
      loadCounselor();
    }
  }, [counselorId, navigate, user, show]);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDate || !counselorId) return;
      try {
        const response = await api.get(`/counselors/${counselorId}/schedule?date=${selectedDate}&appointment_type=${appointmentType}`);
        setAvailableSlots(response.data || []);
      } catch (err) {
        console.error('Error loading available slots:', err);
        setAvailableSlots([]);
      }
    };

    loadAvailableSlots();
  }, [selectedDate, counselorId, appointmentType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra email verification trước khi submit
    if (user && !user.email_verified) {
      show(
        'Vui lòng xác thực email trước khi đặt lịch tư vấn. Chúng tôi đã gửi email xác thực đến địa chỉ email của bạn.',
        { 
          title: 'Cần xác thực email', 
          type: 'warning',
          duration: 6000
        }
      );
      return;
    }
    
    // Validation
    if (!selectedDate) {
      show('Vui lòng chọn ngày hẹn', { title: 'Thiếu thông tin', type: 'error' });
      return;
    }
    
    if (!selectedTime) {
      show('Vui lòng chọn giờ hẹn', { title: 'Thiếu thông tin', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const appointmentData = {
        counselor_id: counselorId, // Use counselorId from URL params (which is user_id)
        appointment_type: appointmentType,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        notes: notes,
        is_anonymous: appointmentType === 'online' ? isAnonymous : false
      };
      
      console.log('[BookAppointment] Sending appointment data:', appointmentData);
      console.log('[BookAppointment] selectedDate type:', typeof selectedDate, 'value:', selectedDate);

      // Create appointment first
      const response = await api.post('/appointments', appointmentData);
      console.log('[BookAppointment] Response:', response.data);
      const appointmentId = response.data?.appointmentId;

      // Determine amount based on type
      const amount = appointmentType === 'online' ? (counselor.online_price || 0) : (counselor.offline_price || 0);

      if (amount && amount > 0) {
        // Request VNPAY payment URL
        const payRes = await api.post('/payment/create', { bookingId: appointmentId, amount });
        const paymentUrl = payRes.data?.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return; // redirecting
        }
      }

      // Fallback: no amount or payment URL
      show('Chuyên gia sẽ xác nhận trong thời gian sớm nhất.', { title: 'Đặt lịch thành công', type: 'success' });
      navigate('/patient/appointments');
    } catch (err) {
      console.error('Error booking appointment:', err);
      show(err.response?.data?.message || 'Có lỗi khi đặt lịch. Vui lòng thử lại.', { title: 'Đặt lịch thất bại', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Tối thiểu là ngày mai
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Tối đa 30 ngày
    return maxDate.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <UserPage title="Đặt lịch tư vấn">
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải thông tin...</div>
        </div>
      </UserPage>
    );
  }

  if (!counselor) {
    return (
      <UserPage title="Đặt lịch tư vấn">
        <div className="text-center py-12">
          <div className="text-red-500">Không tìm thấy thông tin chuyên gia</div>
        </div>
      </UserPage>
    );
  }

  return (
    <UserPage title="Đặt lịch tư vấn">
      <div className="mb-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:underline"
        >
          ← Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thông tin chuyên gia */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin chuyên gia</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{counselor.full_name}</h3>
                <p className="text-gray-600">{counselor.specialty_name}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800">Kinh nghiệm</h4>
                <p className="text-gray-600">{counselor.experience_years} năm</p>
                {counselor.experience_description && (
                  <div className="mt-1">
                    <p className={`text-sm text-gray-500 ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                      {counselor.experience_description}
                    </p>
                    {counselor.experience_description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-1 text-cyan-600 hover:text-cyan-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
                      >
                        {showFullDescription ? (
                          <>
                            Thu gọn
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Xem thêm
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-800">Giá tư vấn</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trực tuyến:</span>
                    <span className="font-semibold">{counselor.online_price ? `${counselor.online_price.toLocaleString()} VNĐ` : 'Liên hệ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tại phòng khám:</span>
                    <span className="font-semibold">{counselor.offline_price ? `${counselor.offline_price.toLocaleString()} VNĐ` : 'Liên hệ'}</span>
                  </div>
                </div>
              </div>

              {counselor.clinic_address && (
                <div>
                  <h4 className="font-medium text-gray-800">Địa chỉ phòng khám</h4>
                  <p className="text-sm text-gray-600">{counselor.clinic_address}</p>
                </div>
              )}

              {counselor.working_hours && (
                <div>
                  <h4 className="font-medium text-gray-800">Giờ làm việc</h4>
                  <p className="text-sm text-gray-600">{counselor.working_hours}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form đặt lịch */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Thông tin đặt lịch</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Loại tư vấn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Loại tư vấn *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      appointmentType === 'online' 
                        ? 'border-cyan-500 bg-cyan-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => { setAppointmentType('online'); setSelectedTime(''); }}
                  >
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        name="appointmentType" 
                        value="online" 
                        checked={appointmentType === 'online'}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-semibold">Tư vấn trực tuyến</div>
                        <div className="text-sm text-gray-600">Video call qua nền tảng</div>
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      appointmentType === 'offline' 
                        ? 'border-cyan-500 bg-cyan-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => { setAppointmentType('offline'); setSelectedTime(''); }}
                  >
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        name="appointmentType" 
                        value="offline" 
                        checked={appointmentType === 'offline'}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-semibold">Tư vấn tại phòng khám</div>
                        <div className="text-sm text-gray-600">Gặp trực tiếp tại địa chỉ</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {appointmentType === 'online' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Chế độ tư vấn trực tuyến *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${!isAnonymous ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={()=>setIsAnonymous(false)}
                    >
                      <div className="flex items-start gap-3">
                        <input type="radio" name="anon" checked={!isAnonymous} onChange={()=>setIsAnonymous(false)} className="mt-1"/>
                        <div>
                          <div className="font-semibold">🔒 Tư vấn bình thường</div>
                          <div className="text-xs text-gray-600">Hiển thị thông tin thật, lưu hồ sơ theo dõi</div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isAnonymous ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}
                      onClick={()=>setIsAnonymous(true)}
                    >
                      <div className="flex items-start gap-3">
                        <input type="radio" name="anon" checked={isAnonymous} onChange={()=>setIsAnonymous(true)} className="mt-1"/>
                        <div>
                          <div className="font-semibold">🕶️ Tư vấn ẩn danh</div>
                          <div className="text-xs text-gray-600">Ẩn danh với chuyên gia, vẫn cần đặt lịch và thanh toán</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chọn ngày */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ngày *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Chọn giờ */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn giờ *
                  </label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setSelectedTime(slot.time)}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            selectedTime === slot.time
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 p-4 border border-gray-200 rounded-lg text-center">
                      Không có giờ trống trong ngày này
                    </div>
                  )}
                </div>
              )}

              {/* Ghi chú */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú thêm
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mô tả vấn đề muốn tư vấn, triệu chứng, hoặc thông tin khác..."
                  rows={4}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Nút đặt lịch */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || !selectedDate || !selectedTime}
                  className="w-full py-3 bg-cyan-400 text-white rounded-lg font-semibold hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Đang đặt lịch...' : 'Đặt lịch tư vấn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </UserPage>
  );
}
