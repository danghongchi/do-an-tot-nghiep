import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CounselorCard from '../../components/CounselorCard';
import { useAuth } from '../../contexts/AuthContext';

export default function PatientHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState([]);
  const [topCounselors, setTopCounselors] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [heroQuery, setHeroQuery] = useState('');

  useEffect(() => {
    (async () => {
      // Load specialties
      try {
        const sp = await api.get('/specialties');
        setSpecialties(sp.data || []);
      } catch (err) {
        // Không chặn UI nếu lỗi
        console.warn('Load specialties error', err.response?.status || err.message);
      }

      // Load top counselors
      try {
        const top = await api.get('/counselors?sort=rating&limit=3');
        setTopCounselors((top.data || []).slice(0,3));
      } catch (err) {
        console.warn('Load top counselors error', err.response?.status || err.message);
      }

      // Load upcoming appointments nếu là user đăng nhập
      try {
        if (user?.role === 'user') {
          const appointments = await api.get('/patient/appointments');
          const today = new Date().toISOString().slice(0, 10);
          const upcoming = (appointments.data || [])
            .filter(apt => apt.appointment_date >= today && apt.status !== 'cancelled' && apt.status !== 'completed')
            .slice(0, 3);
          setUpcomingAppointments(upcoming);
        } else {
          setUpcomingAppointments([]);
        }
      } catch (err) {
        // Nếu lỗi quyền truy cập thì bỏ qua phần lịch hẹn
        if (err.response?.status !== 403) {
          console.warn('Load appointments error', err.response?.status || err.message);
        }
        setUpcomingAppointments([]);
      }
    })();
  }, [user]);

  const cancelAppointment = async (id) => {
    if (!confirm('Bạn có chắc muốn hủy lịch này?')) return;
    try {
      await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
      setUpcomingAppointments(prev => prev.filter(apt => apt.id !== id));
      alert('Hủy lịch hẹn thành công');
    } catch (err) {
      alert('Hủy không thành công: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-cyan-100 text-cyan-800';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang diễn ra';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Landing page (for guests)
  if (!user) {
    return (
      <div className="w-full bg-comfort-gradient">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-14 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
            Chăm sóc sức khỏe tâm lý
            <br className="hidden md:block" />
            của bạn
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Kết nối với các chuyên gia tâm lý hàng đầu. Đặt lịch tư vấn trực tuyến hoặc tại phòng khám một cách dễ dàng và bảo mật.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/login" className="px-5 py-2.5 rounded-md bg-cyan-400 text-white hover:bg-cyan-500 shadow-soft">
              Đặt lịch ngay
            </Link>
            <Link to="/login" className="px-5 py-2.5 rounded-md border border-cyan-400 text-cyan-500 hover:bg-cyan-50">
              Tìm chuyên gia
            </Link>
          </div>
        </section>

        {/* Why choose us */}
        <section className="bg-white border-t border-b border-gray-200 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-xl md:text-2xl font-semibold text-gray-900">Tại sao chọn MindCare?</h2>
            <p className="text-center text-gray-600 mt-2 mb-6">Chúng tôi cung cấp dịch vụ tư vấn tâm lý chuyên nghiệp với công nghệ hiện đại</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-5 rounded-md border border-cyan-200 bg-cyan-50">
                <div className="font-semibold text-cyan-800">Đặt lịch dễ dàng</div>
                <div className="text-sm text-cyan-400">Đặt lịch chỉ với vài bước và chọn giờ linh hoạt phù hợp.</div>
              </div>
              <div className="p-5 rounded-md border border-cyan-200 bg-cyan-50">
                <div className="font-semibold text-cyan-800">Tư vấn trực tuyến</div>
                <div className="text-sm text-cyan-400">Trò chuyện trực tiếp với chuyên gia qua video call hoặc tin nhắn bảo mật.</div>
              </div>
              <div className="p-5 rounded-md border border-cyan-200 bg-cyan-50">
                <div className="font-semibold text-cyan-800">Bảo mật tuyệt đối</div>
                <div className="text-sm text-cyan-400">Dữ liệu được mã hóa và tuân thủ các tiêu chuẩn bảo mật nghiêm ngặt.</div>
              </div>
              <div className="p-5 rounded-md border border-orange-200 bg-orange-50">
                <div className="font-semibold text-orange-800">Chuyên gia giàu kinh nghiệm</div>
                <div className="text-sm text-orange-600">Đội ngũ chuyên gia được tuyển chọn kỹ lưỡng và có nhiều năm kinh nghiệm.</div>
              </div>
              <div className="p-5 rounded-md border border-orange-200 bg-orange-50">
                <div className="font-semibold text-orange-800">Hỗ trợ 24/7</div>
                <div className="text-sm text-orange-600">Hỗ trợ kỹ thuật và hướng dẫn luôn sẵn sàng cho bạn, mọi lúc.</div>
              </div>
              <div className="p-5 rounded-md border border-orange-200 bg-orange-50">
                <div className="font-semibold text-orange-800">Chăm sóc toàn diện</div>
                <div className="text-sm text-orange-600">Từ tư vấn tâm lý đến theo dõi tiến trình điều trị, đồng hành dài lâu với bạn.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Counselors Slider */}
        <section className="bg-cyan-50 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-4">Chuyên gia nổi bật</h2>
            <p className="text-center text-gray-600 mt-1 mb-5">Được người dùng tin tưởng và phản hồi tích cực</p>
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topCounselors.length ? topCounselors.slice(0,3).map(c => (
                  <div key={c.id || c._id} className="transform hover:scale-105 transition-transform duration-300">
                    <CounselorCard counselor={c} isGuest={true} />
                  </div>
                )) : (
                  <div className="col-span-full flex justify-center items-center py-8">
                    <div className="text-gray-500">Đang tải chuyên gia...</div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-center mt-8">
              <Link 
                to="/counselors"
                className="inline-flex items-center px-6 py-3 bg-cyan-400 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium"
              >
                Xem tất cả chuyên gia
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>        {/* CTA */}
        <section className="py-14">
          <div className="max-w-3xl mx-auto text-center px-4">
            <div className="text-lg font-semibold text-gray-900">Sẵn sàng bắt đầu hành trình chăm sóc tâm lý?</div>
            <p className="text-gray-600 mt-1">Đăng ký ngay hôm nay để được tư vấn miễn phí từ các chuyên gia hàng đầu</p>
            <div className="mt-5">
              <Link to="/login" className="px-5 py-2.5 rounded-md bg-cyan-400 text-white hover:bg-cyan-500 shadow-soft">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Advisor entry */}
        <div className="rounded-md border border-cyan-200 bg-cyan-50 p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-accent-900">Chưa biết chọn chuyên gia nào?</div>
            <div className="text-sm text-accent-700">Mở trợ lý “Tư vấn ban đầu” để được gợi ý nhanh.</div>
          </div>

        </div>

        {/* Welcome banner with illustration */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-100 px-6 py-10">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Xin chào, {user?.full_name || 'Người dùng'}
              </h1>
              <p className="mt-2 text-gray-700 max-w-2xl md:max-w-none mx-auto md:mx-0">
                Chào mừng bạn đến với MindCare — kết nối với chuyên gia phù hợp và đặt lịch tư vấn an toàn, bảo mật.
              </p>
              <form onSubmit={(e)=>{ e.preventDefault(); const q=heroQuery.trim(); if(q){ navigate(`/patient/counselors?q=${encodeURIComponent(q)}`); } else { navigate('/patient/counselors'); } }} className="mt-5">
                <div className="relative mx-auto md:mx-0">
                  <input type="text" value={heroQuery} onChange={(e)=>setHeroQuery(e.target.value)} placeholder="Tim kiem chuyen gia, chuyen nganh..." className="w-full md:w-[36rem] pl-5 pr-12 py-3 rounded-full bg-white/80 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 placeholder-gray-400" />
                  <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white flex items-center justify-center shadow" aria-label="Tim kiem">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-4.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </form>
              <div className="mt-5">
                <Link to="/patient/counselors" className="px-5 py-2.5 rounded-md bg-cyan-400 text-white hover:bg-cyan-500 shadow-soft">Tìm chuyên gia</Link>
              </div>
            </div>
            {/* Lightweight illustration */}
            <div className="relative hidden md:block">
              <svg viewBox="0 0 300 200" className="w-full max-w-sm mx-auto md:mx-0" aria-hidden="true">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
                  </linearGradient>
                </defs>
                <rect x="10" y="20" width="220" height="140" rx="16" fill="url(#grad)" stroke="#a5b4fc" strokeOpacity="0.5" />
                <rect x="28" y="38" width="184" height="16" rx="8" fill="#bae6fd" />
                <rect x="28" y="64" width="150" height="12" rx="6" fill="#e0e7ff" />
                <rect x="28" y="84" width="120" height="12" rx="6" fill="#e0e7ff" />
                <circle cx="250" cy="60" r="36" fill="#cffafe" stroke="#22d3ee" strokeOpacity="0.6" />
                <path d="M245 60a5 5 0 0010 0 5 5 0 00-10 0z" fill="#06b6d4" />
                <path d="M235 78c0-8 7-14 15-14s15 6 15 14" stroke="#06b6d4" strokeWidth="2" fill="none" />
                <g opacity="0.7">
                  <circle cx="70" cy="140" r="10" fill="#a7f3d0" />
                  <rect x="90" y="132" width="70" height="16" rx="8" fill="#bbf7d0" />
                </g>
              </svg>
              <div className="absolute -bottom-6 -left-6 w-36 h-36 bg-cyan-200/40 blur-2xl rounded-full" />
              <div className="absolute -top-6 -right-6 w-28 h-28 bg-indigo-200/40 blur-2xl rounded-full" />
            </div>
          </div>
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-200/40 blur-3xl" />
        </section>

        {/* Hero greeting (hidden, kept for fallback) */}
        <section className="text-center hidden">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
            Xin chào, {user?.full_name || 'Người dùng'}
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Chào mừng đến MindCare — kết nối với chuyên gia phù hợp và đặt lịch tư vấn an toàn, bảo mật.
          </p>
          <div className="mt-5">
            <Link to="/patient/counselors" className="px-5 py-2.5 rounded-md bg-cyan-400 text-white hover:bg-cyan-500">Tìm chuyên gia</Link>
          </div>
        </section>

        {/* Features / specialties */}
        <section className="pt-2">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Chuyên ngành nổi bật</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Khám phá và chọn lĩnh vực bạn quan tâm</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {specialties.length ? specialties.slice(0, 8).map((s) => {
              // Mapping icon và màu cho từng chuyên ngành
              const getSpecialtyStyle = (name) => {
                const normalized = name.toLowerCase();
                
                if (normalized.includes('giáo dục') || normalized.includes('giao duc')) {
                  return {
                    gradient: 'from-blue-500 to-indigo-600',
                    icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
                    bgLight: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    hoverShadow: 'hover:shadow-blue-200/50'
                  };
                }
                if (normalized.includes('lâm sàng') || normalized.includes('lam sang')) {
                  return {
                    gradient: 'from-purple-500 to-pink-600',
                    icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
                    bgLight: 'bg-purple-50',
                    borderColor: 'border-purple-200',
                    hoverShadow: 'hover:shadow-purple-200/50'
                  };
                }
                if (normalized.includes('hôn nhân') || normalized.includes('hon nhan') || normalized.includes('gia đình') || normalized.includes('gia dinh')) {
                  return {
                    gradient: 'from-pink-500 to-rose-600',
                    icon: <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>,
                    bgLight: 'bg-pink-50',
                    borderColor: 'border-pink-200',
                    hoverShadow: 'hover:shadow-pink-200/50'
                  };
                }
                if (normalized.includes('hướng nghiệp') || normalized.includes('huong nghiep')) {
                  return {
                    gradient: 'from-amber-500 to-orange-600',
                    icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
                    bgLight: 'bg-amber-50',
                    borderColor: 'border-amber-200',
                    hoverShadow: 'hover:shadow-amber-200/50'
                  };
                }
                if (normalized.includes('phục hồi') || normalized.includes('phuc hoi')) {
                  return {
                    gradient: 'from-emerald-500 to-teal-600',
                    icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
                    bgLight: 'bg-emerald-50',
                    borderColor: 'border-emerald-200',
                    hoverShadow: 'hover:shadow-emerald-200/50'
                  };
                }
                if (normalized.includes('phát triển') || normalized.includes('phat trien')) {
                  return {
                    gradient: 'from-cyan-500 to-blue-600',
                    icon: <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
                    bgLight: 'bg-cyan-50',
                    borderColor: 'border-cyan-200',
                    hoverShadow: 'hover:shadow-cyan-200/50'
                  };
                }
                if (normalized.includes('tổ chức') || normalized.includes('to chuc')) {
                  return {
                    gradient: 'from-slate-500 to-gray-600',
                    icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
                    bgLight: 'bg-slate-50',
                    borderColor: 'border-slate-200',
                    hoverShadow: 'hover:shadow-slate-200/50'
                  };
                }
                if (normalized.includes('trẻ em') || normalized.includes('tre em') || normalized.includes('vị thành niên') || normalized.includes('vi thanh nien')) {
                  return {
                    gradient: 'from-yellow-500 to-amber-600',
                    icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                    bgLight: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    hoverShadow: 'hover:shadow-yellow-200/50'
                  };
                }
                if (normalized.includes('tình yêu') || normalized.includes('tinh yeu') || normalized.includes('quan hệ') || normalized.includes('quan he')) {
                  return {
                    gradient: 'from-red-500 to-pink-600',
                    icon: <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>,
                    bgLight: 'bg-red-50',
                    borderColor: 'border-red-200',
                    hoverShadow: 'hover:shadow-red-200/50'
                  };
                }
                // Default
                return {
                  gradient: 'from-cyan-500 to-teal-600',
                  icon: <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
                  bgLight: 'bg-cyan-50',
                  borderColor: 'border-cyan-200',
                  hoverShadow: 'hover:shadow-cyan-200/50'
                };
              };
              
              const style = getSpecialtyStyle(s.name);
              
              return (
                <Link
                  key={s.id || s._id}
                  to={`/patient/counselors?specialty=${s.id || s._id}`}
                  className={`group relative overflow-hidden rounded-xl border-2 ${style.borderColor} ${style.bgLight} p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${style.hoverShadow}`}
                >
                  {/* Gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  {/* Icon */}
                  <div className="relative mb-3">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                      {style.icon}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 transition-all duration-300">
                      {s.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {s.description || 'Tìm hiểu thêm về chuyên ngành này'}
                    </p>
                  </div>
                  
                  {/* Arrow icon */}
                  <div className="relative mt-4 flex items-center text-gray-400 group-hover:text-gray-600 transition-colors">
                    <span className="text-sm font-medium">Tìm hiểu thêm</span>
                    <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              );
            }) : (
              <div className="col-span-full flex justify-center items-center py-12">
                <div className="flex items-center gap-3 text-gray-500">
                  <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tải chuyên ngành...</span>
                </div>
              </div>
            )}
          </div>
          
          {/* View all button */}
          {specialties.length > 8 && (
            <div className="text-center mt-8">
              <Link 
                to="/patient/counselors"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
              >
                Xem tất cả chuyên ngành
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </section>

        {/* Top counselors */}
        <section className="relative">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl -z-10 opacity-50" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl -z-10" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl -z-10" />
          
          <div className="relative py-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>Được tin tưởng nhất</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Chuyên gia nổi bật</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Những chuyên gia hàng đầu với nhiều năm kinh nghiệm và đánh giá tích cực</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {topCounselors.length ? topCounselors.slice(0, 3).map((c) => (
                <div key={c.id || c._id} className="transform hover:scale-105 transition-all duration-300">
                  <CounselorCard counselor={c} isGuest={user ? false : true} />
                </div>
              )) : (
                <div className="col-span-full flex justify-center items-center py-12">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang tải chuyên gia...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* View all button */}
            <div className="text-center mt-8">
              <Link 
                to="/patient/counselors"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Xem tất cả chuyên gia
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white p-5 rounded-md border border-gray-200">
          <h3 className="font-semibold text-gray-900">Quản lý lịch của bạn</h3>
          <div className="mt-2">
            <Link to="/patient/appointments" className="text-cyan-400 hover:underline">Xem tất cả lịch đã đặt</Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-4">
          <div className="text-gray-900 font-semibold">Cần hỗ trợ thêm?</div>
          <p className="text-gray-600">Liên hệ chúng tôi hoặc mở trợ lý để được hướng dẫn nhanh.</p>
        </section>


      </div>
    </div>
  );
}
