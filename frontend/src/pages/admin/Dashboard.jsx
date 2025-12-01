import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AdminPage from './AdminPage';
import ProgressBar from '../../components/ProgressBar';
import StatCard from '../../components/StatCard';
import RevenueChart from '../../components/RevenueChart';
import { UsersIcon, UserIcon, CalendarIcon, DocumentIcon, ChartBarIcon } from '../../components/icons/AdminIcons';

export default function AdminDashboard(){
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenue, setRevenue] = useState({ total: { revenue: 0, num: 0 }, byMonth: [] });
  const [range, setRange] = useState('12m'); // 7d | 30d | ytd | 12m
  const [revLoading, setRevLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/admin/stats');
        setStats(response.data);
        console.log('Admin stats loaded:', response.data);
        try {
          const rev = await api.get('/admin/revenue/summary');
          setRevenue(rev.data || { total: { revenue: 0, num: 0 }, byMonth: [] });
        } catch (e) { console.warn('revenue summary error', e?.response?.status || e?.message); }
      } catch (err) {
        console.error('Error loading admin stats:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  // Revenue reload with range
  const toDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const loadRevenue = async (r) => {
    try {
      setRevLoading(true);
      const now = new Date();
      let from;
      if (r === '7d') {
        const d = new Date(now); d.setDate(d.getDate() - 6); from = d;
      } else if (r === '30d') {
        const d = new Date(now); d.setDate(d.getDate() - 29); from = d;
      } else if (r === 'ytd') {
        from = new Date(now.getFullYear(), 0, 1);
      } else { // 12m
        from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      }
      const params = new URLSearchParams({ from: toDateStr(from), to: toDateStr(now) });
      const rev = await api.get(`/admin/revenue/summary?${params.toString()}`);
      setRevenue(rev.data || { total: { revenue: 0, num: 0 }, byMonth: [] });
    } catch (e) {
      console.warn('revenue filtered error', e?.response?.status || e?.message);
      setRevenue({ total: { revenue: 0, num: 0 }, byMonth: [] });
    } finally {
      setRevLoading(false);
    }
  };

  useEffect(() => { loadRevenue(range); }, [range]);

  if (loading) {
    return (
      <AdminPage title="Admin Dashboard" subtitle="Tổng quan hệ thống">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-32 bg-gray-200 rounded mt-3" />
              <div className="h-3 w-40 bg-gray-200 rounded mt-3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white/80 p-8 rounded-2xl border border-white/20 shadow animate-pulse h-48" />
          <div className="bg-white/80 p-8 rounded-2xl border border-white/20 shadow animate-pulse h-48" />
        </div>
      </AdminPage>
    );
  }

  if (error) {
    return (
      <AdminPage title="Admin Dashboard" subtitle="Tổng quan hệ thống">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-red-800 flex-1">
              <h3 className="font-semibold text-lg">Lỗi tải thống kê</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium">
              Thử lại
            </button>
          </div>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage 
      title="Admin Dashboard" 
      subtitle={`Cập nhật lần cuối: ${new Date().toLocaleString('vi-VN')}`}
      actions={
        <div className="flex items-center gap-3">
          {/* Total Visits Stats */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tổng lượt truy cập</div>
              <div className="text-xl font-bold text-indigo-700">{stats?.totalVisits || 0}</div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5">
                <span>Người dùng: <span className="font-semibold text-gray-800">{stats?.userVisits || 0}</span></span>
                <span className="text-gray-400">|</span>
                <span>Chuyên gia: <span className="font-semibold text-gray-800">{stats?.counselorVisits || 0}</span></span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Thống kê chính */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
          title="Tổng tài khoản"
          value={(stats?.totalAccounts) ?? ((stats?.totalUsers || 0) + (stats?.totalCounselors || 0) + (stats?.totalAdmins || 0))}
          hint={`${stats?.totalUsers || 0} bệnh nhân`}
          accentClass="from-blue-500 to-blue-600"
          icon={<UsersIcon className="w-6 h-6 text-white" />}
          to="/admin/users"
        />

        <StatCard
          title="Chuyên gia"
          value={stats?.totalCounselors || 0}
          hint="Tư vấn viên đã kích hoạt"
          accentClass="from-purple-500 to-purple-600"
          icon={<UserIcon className="w-6 h-6 text-white" />}
          to="/admin/counselors"
        />

        <StatCard
          title="Lịch hẹn"
          value={stats?.totalAppointments || 0}
          hint="Cuộc hẹn đã đặt"
          accentClass="from-orange-500 to-orange-600"
          icon={<CalendarIcon className="w-6 h-6 text-white" />}
        />

        <StatCard
          title="Đơn đăng ký"
          value={stats?.totalApplications || 0}
          hint={`Chờ duyệt: ${stats?.pendingApplications || 0}`}
          accentClass="from-yellow-500 to-yellow-600"
          icon={<DocumentIcon className="w-6 h-6 text-white" />}
          to="/admin/counselor-applications"
        />
      </div>

      {/* Doanh thu & Thống kê hệ thống */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Doanh thu hệ thống - Bên trái */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Doanh thu hệ thống</div>
              <div className="text-base font-bold text-gray-900">{Number(revenue.total.revenue).toLocaleString('vi-VN')} VNĐ</div>
              <div className="text-xs text-gray-600">Giao dịch: <span className="text-emerald-600 font-semibold">{revenue.total.num}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {[
              {key:'7d', label:'7d'},
              {key:'30d', label:'30d'},
              {key:'ytd', label:'YTD'},
              {key:'12m', label:'12m'},
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => setRange(btn.key)}
                className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${range===btn.key ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}`}
              >{btn.label}</button>
            ))}
          </div>
          <div style={{height: '155px'}}>
            <RevenueChart
              points={[...revenue.byMonth].sort((a,b)=> (a.month > b.month ? 1 : -1)).map(m=>({ label: (m.month||'').slice(5,7)+'/'+(m.month||'').slice(0,4), value: Number(m.revenue)||0 }))}
            />
            {revLoading && <div className="text-xs text-gray-500 mt-1">Đang tải...</div>}
          </div>
        </div>

        {/* Thống kê hệ thống - Bên phải */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Thống kê hệ thống</h3>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-0.5">Chat ẩn danh</div>
              <div className="text-xl font-bold text-gray-900">{stats?.totalAnonymousChats || 0}</div>
              <div className="text-xs text-gray-500">Tổng số chat ẩn danh</div>
            </div>

            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-0.5">Đơn chờ duyệt</div>
              <div className="text-xl font-bold text-gray-900">{stats?.pendingApplications || 0}</div>
              <div className="text-xs text-gray-500">Hồ sơ cần duyệt</div>
            </div>

            <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-0.5">Tổng đơn đăng ký</div>
              <div className="text-xl font-bold text-gray-900">{stats?.totalApplications || 0}</div>
              <div className="text-xs text-gray-500">Tổng tất cả đơn</div>
            </div>

            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-xs text-gray-600 mb-0.5">Email chưa xác thực</div>
              <div className="text-xl font-bold text-gray-900">{stats?.unverifiedEmails || 0}</div>
              <div className="text-xs text-gray-500">Cần gửi/nhắc xác thực</div>
            </div>
          </div>
        </div>
      </div>

      {/* Thống kê chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* User Distribution Chart */}
        <div className="bg-white p-3 rounded-xl shadow border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Phân bố người dùng</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 pr-3">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-gray-700">Bệnh nhân</span>
              </div>
              <ProgressBar
                value={Math.min(100, ((stats?.totalUsers || 0) / ((stats?.totalAccounts || ((stats?.totalUsers || 0) + (stats?.totalCounselors || 0) + (stats?.totalAdmins || 0))) || 1)) * 100)}
                barClass="bg-gradient-to-r from-green-500 to-emerald-500"
                count={stats?.totalUsers || 0}
                label="Tỷ lệ bệnh nhân"
              />
            </div>
            <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 pr-3">
                <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                <span className="text-sm font-medium text-gray-700">Chuyên gia</span>
              </div>
              <ProgressBar
                value={Math.min(100, ((stats?.totalCounselors || 0) / ((stats?.totalAccounts || ((stats?.totalUsers || 0) + (stats?.totalCounselors || 0) + (stats?.totalAdmins || 0))) || 1)) * 100)}
                barClass="bg-gradient-to-r from-purple-500 to-violet-500"
                count={stats?.totalCounselors || 0}
                label="Tỷ lệ chuyên gia"
              />
            </div>
            <div className="flex justify-between items-center p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 pr-3">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium text-gray-700">Quản trị viên</span>
              </div>
              <ProgressBar
                value={Math.min(100, ((stats?.totalAdmins || 0) / ((stats?.totalAccounts || ((stats?.totalUsers || 0) + (stats?.totalCounselors || 0) + (stats?.totalAdmins || 0))) || 1)) * 100)}
                barClass="bg-gradient-to-r from-blue-500 to-indigo-500"
                count={stats?.totalAdmins || 0}
                label="Tỷ lệ quản trị viên"
              />
            </div>

            {/* System Status */}
            <div className="p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Trạng thái hệ thống</span>
                </div>
                <span className="text-sm font-bold text-blue-700">Tốt</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{width: '92%'}}></div>
                </div>
                <span className="text-xs text-gray-600 font-medium">92%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities / System Health */}
        <div className="bg-white p-3 rounded-xl shadow border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Thống kê hoạt động</h3>
          </div>
          <div className="space-y-2.5">
            {/* Active Sessions */}
            <div className="p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Cuộc hẹn hoạt động</span>
                </div>
                <span className="text-lg font-bold text-emerald-700">{stats?.activeAppointments || 0}</span>
              </div>
              <div className="text-xs text-gray-600">Đang diễn ra</div>
            </div>

            {/* Pending Reviews */}
            <div className="p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Đánh giá mới</span>
                </div>
                <span className="text-lg font-bold text-amber-700">{stats?.pendingReviews || 0}</span>
              </div>
              <div className="text-xs text-gray-600">Cần xem xét</div>
            </div>

            {/* Today's Stats */}
            <div className="p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">Đăng ký hôm nay</span>
                </div>
                <span className="text-lg font-bold text-purple-700">{stats?.todayRegistrations || 0}</span>
              </div>
              <div className="text-xs text-gray-600">Tài khoản mới</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-gray-900">Thao tác nhanh</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <Link
            to="/admin/users"
            className="group bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-xs mb-0.5">Người dùng</div>
              <div className="text-xs text-gray-600">Quản lý tài khoản</div>
            </div>
          </Link>
          
          <Link
            to="/admin/specialties"
            className="group bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-xs mb-0.5">Chuyên ngành</div>
              <div className="text-xs text-gray-600">Quản lý lĩnh vực</div>
            </div>
          </Link>
          
          <Link
            to="/admin/counselors"
            className="group bg-gradient-to-br from-purple-50 to-purple-100/50 p-3 rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-xs mb-0.5">Chuyên gia</div>
              <div className="text-xs text-gray-600">Danh sách tư vấn</div>
            </div>
          </Link>
          
          <Link
            to="/admin/counselor-applications"
            className="group bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-3 rounded-lg border border-yellow-200 hover:border-yellow-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-xs mb-0.5">Duyệt hồ sơ</div>
              <div className="text-xs text-gray-600">Xét duyệt đơn</div>
            </div>
          </Link>
          
          <Link
            to="/admin/chats"
            className="group bg-gradient-to-br from-green-50 to-green-100/50 p-3 rounded-lg border border-green-200 hover:border-green-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="font-semibold text-gray-900 text-xs mb-0.5">Chat</div>
              <div className="text-xs text-gray-600">Quản lý trò chuyện</div>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </AdminPage>
  );
}





