import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

export default function CounselorCard({ counselor, isGuest = false }) {
  const { user } = useAuth();
  const { show } = useToast();

  const normalizeUrl = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const base = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api','') : 'http://localhost:5000';
    const path = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
    return base + path;
  };

  const handleBookClick = (e) => {
    if (isGuest) {
      return; // Khách vãng lai sẽ được Link điều hướng đến trang detail
    }
    
    // Kiểm tra email verification
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
      return;
    }
  };

  const avatarSrc = normalizeUrl(counselor.avatar_url || counselor.avatar || counselor.profile_picture);
  const rating = Number(counselor.average_rating || counselor.rating || counselor.avg_rating || 0);
  const reviewCount = Number(counselor.review_count || 0);
  const counters = Number(counselor.completed_appointments || counselor.clients || counselor.sessions || reviewCount || 0);

  return (
    <div className="bg-white rounded-2xl border-2 border-cyan-400 p-4 shadow-sm hover:shadow-md transition-all duration-200 w-full h-full flex flex-col">
      {/* Top content wrapper to push footer down */}
      <div className="flex-1">
        {/* Title */}
        <h3 className="text-lg font-bold text-cyan-500 mb-4 text-center">
          {counselor.full_name}
        </h3>

        <div className="flex gap-4">
        {/* Avatar Section */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={counselor.full_name}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = 'https://ui-avatars.com/api/?background=E5E7EB&color=374151&name=' + encodeURIComponent(counselor.full_name || 'User'); 
                }}
              />
            ) : (
              <div className="text-lg font-semibold text-gray-600">{counselor.full_name?.[0]}</div>
            )}
          </div>
          <Link 
            to={isGuest ? `/counselor/${counselor.id}` : `/patient/counselor/${counselor.id}`}
            className="mt-2 text-xs text-cyan-500 hover:text-cyan-600 font-medium"
          >
            Xem chi tiết
          </Link>
        </div>

        {/* Content Section */}
        <div className="flex-1">
          {/* Info List - Using simple text symbols instead of emojis */}
          <div className="space-y-2 mb-4">
            {/* Specialty */}
            <div className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-700">Chuyên khoa:</span>
                <span className="text-gray-600 ml-1 break-words">
                  {counselor.specialty_name || counselor.specialty?.name || counselor.specialty}
                </span>
              </div>
            </div>

            {/* Experience */}
            {(counselor.experience_years ?? counselor.experienceYears ?? counselor.years_of_experience) && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-700">Chuyên trị:</span>
                  <span className="text-gray-600 ml-1 break-words">
                    {counselor.bio || counselor.description || 
                     `${(counselor.experience_years || counselor.experienceYears || counselor.years_of_experience)} năm kinh nghiệm`}
                  </span>
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="flex items-start gap-2 text-sm">
              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-700">Lịch khám:</span>
                <span className="text-gray-600 ml-1">Hẹn khám</span>
              </div>
            </div>

            {/* Price */}
            {(counselor.online_price || counselor.offline_price) && (
              <div className="flex items-start gap-2 text-sm">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-700">Giá tư vấn:</span>
                  <span className="text-gray-900 font-bold ml-1">
                    {counselor.online_price ? `${Number(counselor.online_price).toLocaleString()}đ` : 
                     counselor.offline_price ? `${Number(counselor.offline_price).toLocaleString()}đ` : 'Liên hệ'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* close top content wrapper */}
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between mt-4">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1 flex items-center gap-1">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-bold text-orange-600">
              {Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : '0.0'}
            </span>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded px-2 py-1 flex items-center gap-1">
            <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="text-sm font-bold text-orange-600">{Number.isFinite(counters) ? counters : 0}</span>
          </div>
        </div>

        {/* Book Button */}
        <Link 
          to={isGuest ? `/counselor/${counselor.id}` : `/patient/book/${counselor.id}`}
          onClick={handleBookClick}
          className="bg-cyan-400 hover:bg-cyan-500 text-white px-6 py-2 rounded-full text-sm font-bold transition-all duration-200 shadow-md"
        >
          Đặt ngay
        </Link>
      </div>
    </div>
  );
}



