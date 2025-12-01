import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import UserPage from '../../components/UserPage';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/Toast';

const ITEMS_PER_PAGE = 2;

export default function CounselorDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { show } = useToast();
  const [counselor, setCounselor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Hàm xử lý click nút đặt lịch
  const handleBookClick = (e) => {
    if (user && !user.email_verified) {
      e.preventDefault();
      show(
        'Vui lòng xác thực email trước khi đặt lịch tư vấn. Chúng tôi đã gửi email xác thực đến địa chỉ email của bạn.',
        { 
          title: 'Cần xác thực email', 
          type: 'warning',
          duration: 6000
        }
      );
    }
  };

  // Must be declared before any early returns to keep hooks order stable
  const avatarSrc = useMemo(() => {
    const raw = counselor?.avatar_url || counselor?.avatar || counselor?.profile_picture;
    if (!raw) return '';
    const url = String(raw).trim();
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api','') : 'http://localhost:5000';
    const path = url.startsWith('/') ? url : '/' + url;
    return base + path;
  }, [counselor]);

  useEffect(() => {
    const loadCounselor = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/counselors/${id}`);
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        setCounselor(data || null);
        // Load reviews by counselor user id
        if (data?.user_id || data?.id) {
          try {
            const rv = await api.get(`/reviews/${data.user_id || data.id}`);
            setReviews(rv.data?.reviews || []);
            setAvg(rv.data?.average || 0);
          } catch (err) {
            console.error('Error loading reviews:', err);
          }
        }
      } catch (err) {
        console.error('Error loading counselor:', err);
        alert('Không thể tải thông tin chuyên gia');
        nav('/patient/counselors');
      } finally {
        setLoading(false);
      }
    };

    loadCounselor();
  }, [id, nav]);

  if (loading) {
    return (
      <UserPage title="Thông tin chuyên gia">
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải thông tin chuyên gia...</div>
        </div>
      </UserPage>
    );
  }

  if (!counselor) {
    return (
      <UserPage title="Thông tin chuyên gia">
        <div className="text-center py-12">
          <div className="text-red-500">Không tìm thấy thông tin chuyên gia</div>
        </div>
      </UserPage>
    );
  }

  const formatCurrency = (value) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!isFinite(num) || num <= 0) return null;
    try { return num.toLocaleString('vi-VN'); } catch { return String(num); }
  };

  return (
    <UserPage title="Thông tin chuyên gia">
      {/* Back button */}
      <div className="mb-6 max-w-6xl mx-auto px-4">
        <button 
          onClick={() => nav(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Quay lại danh sách chuyên gia</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Main Card with gradient header */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-700/20 rounded-full blur-2xl -ml-24 -mb-24" />
            
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-5">
                {/* Avatar with better styling */}
                <div className="relative group">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shadow-xl">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={counselor.full_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => { 
                          e.currentTarget.onerror = null; 
                          e.currentTarget.src = 'https://ui-avatars.com/api/?background=06B6D4&color=FFFFFF&name=' + encodeURIComponent(counselor.full_name || 'User'); 
                        }}
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">{counselor.full_name?.[0]}</span>
                    )}
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/30">
                      Chuyên gia được chứng nhận
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                    {counselor.full_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-white/90">
                    <span className="inline-flex items-center gap-1.5 text-base font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {counselor.specialty_name}
                    </span>
                    <span className="text-white/70">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{avg > 0 ? avg.toFixed(1) : 'Chưa có'}</span>
                      <span className="text-white/70">({reviews.length} đánh giá)</span>
                    </span>
                    <span className="text-white/70">•</span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {counselor.experience_years || '5'}+ năm kinh nghiệm
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="md:ml-auto">
                <Link
                  to={`/patient/book/${counselor.user_id || counselor.id}`}
                  onClick={handleBookClick}
                  className="group inline-flex items-center gap-2 bg-white text-cyan-600 px-6 py-3.5 rounded-xl font-bold hover:bg-cyan-50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Đặt lịch tư vấn
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Giới thiệu */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Giới thiệu</h2>
                  </div>
                  <div className="relative">
                    <p className={`text-gray-700 leading-relaxed text-sm ${!showFullDescription ? 'line-clamp-4' : ''}`}>
                      {counselor.experience_description || 'Chưa có'}
                    </p>
                    {counselor.experience_description && counselor.experience_description.length > 200 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-cyan-600 hover:text-cyan-700 font-medium text-sm inline-flex items-center gap-1 transition-colors"
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
                </div>

                {/* Grid 2 columns for Kinh nghiệm & Giờ làm việc */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kinh nghiệm */}
                  <div className="bg-white rounded-xl p-5 border-2 border-purple-200 hover:border-purple-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Kinh nghiệm</h3>
                    </div>
                    <div className="mb-2">
                      <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {counselor.experience_years || '2'}
                      </span>
                      <span className="text-gray-600 font-medium ml-1">năm kinh nghiệm</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Chuyên gia đã có nhiều năm kinh nghiệm trong lĩnh vực tâm lý học và tư vấn tâm lý.
                    </p>
                  </div>

                  {/* Giờ làm việc */}
                  <div className="bg-white rounded-xl p-5 border-2 border-teal-200 hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">Giờ làm việc</h3>
                    </div>
                    <p className="text-gray-700 font-medium text-sm">{counselor.working_hours || 'Thứ 2-6'}</p>
                  </div>
                </div>

                {/* Địa chỉ phòng khám */}
                <div className="bg-white rounded-xl p-5 border-2 border-blue-200 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Địa chỉ phòng khám</h3>
                  </div>
                  <p className="text-gray-700 text-sm">{counselor.clinic_address || 'số 25 đường Nguyễn Hữu Thọ, Phường Tân Hưng, Quận 7'}</p>
                </div>

                {/* Thông tin liên hệ */}
                <div className="bg-white rounded-xl p-5 border-2 border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Thông tin liên hệ</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <a href={`mailto:${counselor.email}`} className="text-cyan-600 hover:text-cyan-700 font-medium text-sm break-all">
                          {counselor.email}
                        </a>
                      </div>
                    </div>
                    {counselor.phone && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <div className="text-xs text-gray-500">Điện thoại</div>
                          <a href={`tel:${counselor.phone}`} className="text-cyan-600 hover:text-cyan-700 font-medium text-sm">
                            {counselor.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right sidebar - 1/3 width */}
              <div className="space-y-6">
                {/* Giá tư vấn */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Giá tư vấn</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-cyan-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-sm font-medium">Trực tuyến:</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-orange-600">
                        {formatCurrency(counselor.online_price) ? `${formatCurrency(counselor.online_price)} ₫` : '600.000 ₫'}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-emerald-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600 text-sm font-medium">Tại phòng khám:</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-emerald-600">
                        {formatCurrency(counselor.offline_price) ? `${formatCurrency(counselor.offline_price)} ₫` : '550.000 ₫'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gửi đánh giá */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">Gửi đánh giá</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-2 block">Đánh giá:</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            onClick={() => setReviewRating(n)}
                            className={`w-8 h-8 rounded transition-all ${
                              n <= reviewRating 
                                ? 'text-yellow-400 scale-110' 
                                : 'text-gray-300 hover:text-gray-400'
                            }`}
                          >
                            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <textarea 
                      value={reviewText} 
                      onChange={e => setReviewText(e.target.value)} 
                      placeholder="Cảm nhận của bạn sau buổi tư vấn..." 
                      className="w-full border-2 border-purple-200 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 resize-none"
                    />
                    
                    <button
                      onClick={async () => {
                        if (!reviewText.trim()) { alert('Vui lòng nhập nhận xét'); return; }
                        setSubmitting(true);
                        try {
                          const apps = await api.get(`/appointments/my?counselor_user_id=${counselor.user_id || counselor.id}&status=completed`);
                          const last = (apps.data || []).slice(-1)[0];
                          if (!last) { alert('Bạn cần hoàn thành 1 buổi tư vấn để đánh giá.'); return; }
                          await api.post('/reviews', { appointment_id: last.id, rating: reviewRating, comment: reviewText.trim() });
                          setReviewText('');
                          const rv = await api.get(`/reviews/${counselor.user_id || counselor.id}`);
                          setReviews(rv.data?.reviews || []);
                          setAvg(rv.data?.average || 0);
                          alert('Gửi đánh giá thành công');
                        } catch (e) {
                          alert(e.response?.data?.message || 'Gửi đánh giá thất bại');
                        } finally { setSubmitting(false); }
                      }}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2.5 px-4 rounded-lg text-sm font-bold hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                    
                    {/* Nút đặt lịch */}
                    <Link
                      to={`/patient/book/${counselor.user_id || counselor.id}`}
                      onClick={handleBookClick}
                      className="group w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mt-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Đặt lịch tư vấn ngay
                      <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section - Separate Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Đánh giá của người dùng</h2>
                <p className="text-sm text-gray-600">{reviews.length} đánh giá • Trung bình: {avg > 0 ? avg.toFixed(1) : 'Chưa có'}/5.0</p>
              </div>
            </div>
            
            {reviews.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500 font-medium">Chưa có đánh giá nào</p>
                <p className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên đánh giá chuyên gia này</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(() => {
                    const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const currentReviews = reviews.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                    
                    return currentReviews.map(r => (
                      <div key={r.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                              {r.patient_name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-sm">{r.patient_name}</div>
                              <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200">
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-bold text-yellow-700 text-sm">{r.rating}/5</span>
                          </div>
                        </div>
                        {r.comment && (
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{r.comment}</p>
                        )}
                      </div>
                    ));
                  })()}
                </div>
                
                {/* Pagination */}
                {reviews.length > ITEMS_PER_PAGE && (
                  <div className="mt-4 flex justify-center">
                    <Pagination
                      current={currentPage}
                      totalPages={Math.ceil(reviews.length / ITEMS_PER_PAGE)}
                      onChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </UserPage>
  );
}
