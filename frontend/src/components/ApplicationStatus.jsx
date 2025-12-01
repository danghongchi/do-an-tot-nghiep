import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function ApplicationStatus() {
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'user') {
      fetchApplicationStatus();
    }
  }, [user]);

  const fetchApplicationStatus = async () => {
    try {
      const response = await api.get('/counselor-applications/my-status');
      if (response.data.has_application) {
        setApplication(response.data.application);
      }
    } catch (error) {
      console.error('Lỗi lấy trạng thái hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'user' || loading) {
    return null;
  }

  if (!application) {
    return (
      <div className="w-full mb-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/60">
            <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-blue-800">Bạn chưa nộp hồ sơ trở thành chuyên gia</div>
                <div className="mt-1 text-sm text-blue-700">Nếu muốn trở thành chuyên gia tư vấn, hãy nộp hồ sơ để admin duyệt.</div>
              </div>
              <a
                href="/counselor-application"
                className="w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Nộp hồ sơ ngay
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending_review':
        return {
          icon: '⏳',
          title: 'Hồ sơ đang chờ duyệt',
          message: 'Hồ sơ của bạn đang được admin xem xét. Vui lòng chờ thông báo.',
          color: 'yellow'
        };
      case 'approved':
        return {
          icon: '✅',
          title: 'Hồ sơ đã được duyệt',
          message: 'Chúc mừng! Bạn đã trở thành chuyên gia tư vấn. Bạn có thể bắt đầu nhận lịch hẹn.',
          color: 'green'
        };
      case 'rejected':
        return {
          icon: '❌',
          title: 'Hồ sơ bị từ chối',
          message: `Hồ sơ của bạn đã bị từ chối. Lý do: ${application.rejection_reason || 'Không được cung cấp'}`,
          color: 'red'
        };
      default:
        return {
          icon: '❓',
          title: 'Trạng thái không xác định',
          message: 'Trạng thái hồ sơ không xác định.',
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusInfo(application.status);
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  return (
    <div className={`border rounded-lg p-4 mb-6 ${colorClasses[statusInfo.color]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 text-2xl">
          {statusInfo.icon}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {statusInfo.title}
          </h3>
          <div className="mt-2 text-sm">
            <p>{statusInfo.message}</p>
          </div>
          <div className="mt-2 text-xs opacity-75">
            <p>Nộp hồ sơ: {new Date(application.created_at).toLocaleDateString('vi-VN')}</p>
            {application.reviewed_at && (
              <p>Duyệt lúc: {new Date(application.reviewed_at).toLocaleDateString('vi-VN')}</p>
            )}
          </div>
          {application.status === 'rejected' && (
            <div className="mt-3">
              <a
                href="/counselor-application"
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Nộp hồ sơ mới
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

