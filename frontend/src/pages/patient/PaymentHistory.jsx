import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import UserPage from '../../components/UserPage';

export default function PaymentHistory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [exporting, setExporting] = useState(false);

  const loadHistory = async (status = '', page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page, limit: 50 });
      if (status) params.append('status', status);
      
      const res = await api.get(`/payment/history?${params.toString()}`);
      
      if (res.data.data) {
        setItems(Array.isArray(res.data.data) ? res.data.data : []);
        setPagination(res.data.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });
      } else {
        // Backward compatibility with old endpoint format
        setItems(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) {
      console.error('Load payment history error:', e);
      setError(e.response?.data?.message || e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(statusFilter, pagination.page);
  }, [statusFilter, pagination.page]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await api.get(`/payment/history/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
      alert('Lỗi khi xuất dữ liệu: ' + (e.response?.data?.message || e.message));
    } finally {
      setExporting(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      success: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white',
      pending: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      failed: 'bg-gradient-to-r from-red-400 to-rose-500 text-white',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };



  const statusText = (status) => {
    const map = {
      success: 'Thành công',
      pending: 'Đang xử lý',
      failed: 'Thất bại',
    };
    return map[status] || status;
  };

  const formatVND = (n) => {
    try { return Number(n).toLocaleString('vi-VN'); } catch { return n; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr.replace('T',' ').slice(0,19);
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const deletePayment = async (paymentId) => {
    if (!confirm('Bạn có chắc muốn xóa giao dịch này khỏi lịch sử? Hành động này không thể hoàn tác.')) {
      return;
    }
    
    try {
      await api.delete(`/payment/history/${paymentId}`);
      setItems(prev => prev.filter(item => item.id !== paymentId));
      alert('Xóa lịch sử thanh toán thành công');
    } catch (err) {
      console.error('Delete payment error:', err);
      alert('Xóa không thành công: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <UserPage title="">
        <div className="space-y-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-xl" />
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
      <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 rounded-2xl shadow-lg p-4 mb-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Lịch sử thanh toán</h1>
              <p className="text-purple-50 text-xs">Quản lý các giao dịch thanh toán của bạn</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Lọc theo trạng thái:</span>
          <div className="flex gap-2">
            <button
              onClick={() => { setStatusFilter(''); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === '' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setStatusFilter('success'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'success' 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Thành công
            </button>
            <button
              onClick={() => { setStatusFilter('pending'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'pending' 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Đang xử lý
            </button>
            <button
              onClick={() => { setStatusFilter('failed'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === 'failed' 
                  ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Thất bại
            </button>
          </div>
          
          {pagination.total > 0 && (
            <span className="ml-auto text-xs text-gray-600">
              Tổng: <span className="font-semibold">{pagination.total}</span> giao dịch
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-red-800 text-sm">Có lỗi xảy ra</h4>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow border border-dashed border-gray-300 p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Chưa có giao dịch nào</h3>
          <p className="text-sm text-gray-600">Lịch sử thanh toán của bạn sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Transaction List */}
          <div className="space-y-2.5 mb-4">
            {items.map((p, idx) => (
              <div key={p.id || p.txn_ref || idx} className="group bg-white rounded-xl shadow border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all overflow-hidden">
                {/* Status bar */}
                <div className={`h-1 ${
                  p.status === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                  p.status === 'pending' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                  'bg-gradient-to-r from-red-400 to-rose-500'
                }`} />
                
                <div className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-sm font-semibold text-gray-700">
                              {p.gateway?.toUpperCase() || 'THANH TOÁN'}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(p.status)}`}>
                              {statusText(p.status)}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-purple-600">
                            {formatVND(p.amount)} ₫
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2 text-gray-700">
                          <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-semibold">{formatDate(p.created_at)}</span>
                        </div>
                        
                        {p.counselor_name && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-semibold">{p.counselor_name}</span>
                            {p.counselor_specialty && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                {p.specialty_icon} {p.counselor_specialty}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {p.appointment_date && (
                          <div className="flex items-center gap-2 text-gray-700">
                            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Lịch hẹn: {formatDateOnly(p.appointment_date)} {p.appointment_time}</span>
                            {p.appointment_type && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                p.appointment_type === 'online' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {p.appointment_type === 'online' ? '📹 Online' : '🏥 Offline'}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {p.txn_ref && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">Mã GD: {p.txn_ref}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <div className="lg:min-w-[80px]">
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="w-full px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
                        title="Xóa giao dịch"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang <span className="font-semibold">{pagination.page}</span> / <span className="font-semibold">{pagination.totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                
                {/* Page numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          pagination.page === pageNum
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </UserPage>
  );
}

