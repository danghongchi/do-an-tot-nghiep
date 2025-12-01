import React, { useEffect, useMemo, useState } from 'react';
import UserPage from '../../components/UserPage';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { useToast } from '../../components/Toast';

// Vietnamese labels encoded with Unicode escapes to avoid mojibake
const VI = {
  pageTitle: "H\u1ED3 s\u01A1 c\u00E1 nh\u00E2n",
  pageSubtitle: "Qu\u1EA3n l\u00FD th\u00F4ng tin, b\u1EA3o m\u1EADt, quy\u1EC1n ri\u00EAng t\u01B0 v\u00E0 l\u1ECBch s\u1EED t\u01B0 v\u1EA5n",
  personalInfo: "Th\u00F4ng tin c\u00E1 nh\u00E2n",
  hoTen: "H\u1ECD v\u00E0 t\u00EAn",
  email: "Email",
  soDienThoai: "S\u1ED1 \u0111i\u1EC7n tho\u1EA1i",
  gioiTinh: "Gi\u1EDBi t\u00EDnh",
  ngaySinh: "Ng\u00E0y sinh",
  diaChi: "\u0110\u1ECBa ch\u1EC9",
  capNhatThongTin: "C\u1EADp nh\u1EADt th\u00F4ng tin c\u00E1 nh\u00E2n",
  khoiPhuc: "Kh\u00F4i ph\u1EE5c",
  luuThayDoi: "L\u01B0u thay \u0111\u1ED5i",
  dangLuu: "\u0110ang l\u01B0u...",
  quyenRiengTu: "Quy\u1EC1n ri\u00EAng t\u01B0",
  batAnDanh: "B\u1EADt \u1EA9n danh m\u1EB7c \u0111\u1ECBnh cho bu\u1ED5i t\u01B0 v\u1EA5n m\u1EDBi",
  choPhepLuuGhiChu: "Cho ph\u00E9p l\u01B0u ghi ch\u00FA/k\u1EBFt qu\u1EA3 bu\u1ED5i t\u01B0 v\u1EA5n",
  nhanThongBaoEmail: "Nh\u1EADn th\u00F4ng b\u00E1o qua email",
  nhanThongBaoDay: "Nh\u1EADn th\u00F4ng b\u00E1o \u0111\u1EA9y (push notification)",
  lichSuTuVan: "L\u1ECBch s\u1EED t\u01B0 v\u1EA5n",
  tatCa: "T\u1EA5t c\u1EA3",
  dangCho: "\u0110ang ch\u1EDD",
  daXacNhan: "\u0110\u00E3 x\u00E1c nh\u1EADn",
  dangDienRa: "\u0110ang di\u1EC5n ra",
  daHoanThanh: "\u0110\u00E3 ho\u00E0n th\u00E0nh",
  daHuy: "\u0110\u00E3 h\u1EE7y",
  chuyenGia: "Chuy\u00EAn gia",
  khongCoBuoi: "Kh\u00F4ng c\u00F3 bu\u1ED5i t\u01B0 v\u1EA5n ph\u00F9 h\u1EE3p b\u1ED9 l\u1ECDc.",
  thanhToanVaGoiDichVu: "Thanh to\u00E1n & g\u00F3i d\u1ECBch v\u1EE5",
  tinhNangThanhToan: "Hi\u1EC7n t\u00EDnh n\u0103ng thanh to\u00E1n v\u00E0 tr\u1EA1ng th\u00E1i thanh to\u00E1n s\u1EBD \u0111\u01B0\u1EE3c b\u1ED5 sung khi ho\u00E0n thi\u1EC7n t\u00EDch h\u1EE3p VNPay production.",
  dangTai: "\u0110ang t\u1EA3i...",
  nguoiDung: "Ng\u01B0\u1EDDi d\u00F9ng",
  thanhCong: "Th\u00E0nh c\u00F4ng",
  loi: "L\u1ED7i",
  capNhatHoSoThanhCong: "C\u1EADp nh\u1EADt h\u1ED3 s\u01A1 th\u00E0nh c\u00F4ng",
  capNhatHoSoThatBai: "C\u1EADp nh\u1EADt h\u1ED3 s\u01A1 th\u1EA5t b\u1EA1i"
};

export default function Profile() {
  const { user, token, login } = useAuth();
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit profile form state
  const [form, setForm] = useState({ full_name: '', phone: '', gender: '', date_of_birth: '' });
  const [saving, setSaving] = useState(false);

  // Local settings (can be persisted to backend later)
  const [privacy, setPrivacy] = useState(() => {
    const raw = localStorage.getItem('mc_privacy_settings');
    return raw ? JSON.parse(raw) : { allowAnonymousByDefault: false, saveSessionNotes: true };
  });
  const [notifications, setNotifications] = useState(() => {
    const raw = localStorage.getItem('mc_notification_settings');
    return raw ? JSON.parse(raw) : { email: true, push: false };
  });

  useEffect(() => {
    localStorage.setItem('mc_privacy_settings', JSON.stringify(privacy));
  }, [privacy]);

  useEffect(() => {
    localStorage.setItem('mc_notification_settings', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/auth/me');
        if (mounted) setMe(res.data.user);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingMe(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/appointments/my');
        if (mounted) setAppointments(res.data || []);
      } catch (e) {
        if (mounted) setAppointments([]);
      } finally {
        if (mounted) setLoadingAppts(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (me) {
      setForm({
        full_name: me.full_name || '',
        phone: me.phone || '',
        gender: me.gender || '',
        date_of_birth: me.date_of_birth ? formatDateForInput(me.date_of_birth) : ''
      });
    }
  }, [me]);

  const saveProfile = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      const payload = { ...form };
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k]; });
      const res = await api.put('/patient/profile', payload);
      const updated = res.data?.user || { ...me, ...payload };
      setMe(updated);
      try { if (token) login({ token, user: updated }); } catch {}
      toast?.show?.(VI.capNhatHoSoThanhCong, { title: VI.thanhCong, type: 'success' });
    } catch (err) {
      const msg = err?.response?.data?.message || VI.capNhatHoSoThatBai;
      toast?.show?.(msg, { title: VI.loi, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'all') return appointments;
    return (appointments || []).filter(a => (a.status || '').toLowerCase() === statusFilter);
  }, [appointments, statusFilter]);

  return (
    <UserPage title="" subtitle="">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 rounded-3xl shadow-2xl p-8 mb-6 text-white">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold shadow-2xl border-4 border-white/30">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-1">{user?.full_name || VI.nguoiDung}</h1>
            <p className="text-purple-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {user?.email}
            </p>
            <p className="text-sm text-purple-200 mt-2">{VI.pageSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Display */}
          <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{VI.personalInfo}</h3>
            </div>
            {loadingMe ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard label={VI.hoTen} value={me?.full_name || '-'} />
                <InfoCard label={VI.email} value={me?.email || '-'} />
                <InfoCard label={VI.soDienThoai} value={me?.phone || '-'} />
                <InfoCard label={VI.gioiTinh} value={me?.gender === 'male' ? 'Nam' : me?.gender === 'female' ? 'Nữ' : me?.gender || '-'} />
                <InfoCard label={VI.ngaySinh} value={me?.date_of_birth ? new Date(me.date_of_birth).toLocaleDateString('vi-VN') : '-'} />
              </div>
            )}
          </section>

          {/* Update Profile Form */}
          <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{VI.capNhatThongTin}</h3>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={VI.hoTen} value={form.full_name} onChange={(v)=>setForm(f=>({ ...f, full_name: v }))} />
                <Input label={VI.email} value={me?.email || ''} disabled />
                <Input label={VI.soDienThoai} value={form.phone} onChange={(v)=>setForm(f=>({ ...f, phone: v }))} />
                <Select label={VI.gioiTinh} value={form.gender} onChange={(v)=>setForm(f=>({ ...f, gender: v }))} />
                <Input label={VI.ngaySinh} type="date" value={form.date_of_birth} onChange={(v)=>setForm(f=>({ ...f, date_of_birth: v }))} />
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                  {saving ? VI.dangLuu : VI.luuThayDoi}
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Privacy Settings */}
          <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{VI.quyenRiengTu}</h3>
            </div>
            <div className="space-y-3">
              <Toggle
                label={VI.batAnDanh}
                checked={privacy.allowAnonymousByDefault}
                onChange={(v) => setPrivacy(p => ({ ...p, allowAnonymousByDefault: v }))}
              />
              <Toggle
                label={VI.choPhepLuuGhiChu}
                checked={privacy.saveSessionNotes}
                onChange={(v) => setPrivacy(p => ({ ...p, saveSessionNotes: v }))}
              />
              <div className="h-px bg-gray-200 my-4" />
              <Toggle
                label={VI.nhanThongBaoEmail}
                checked={notifications.email}
                onChange={(v) => setNotifications(n => ({ ...n, email: v }))}
              />
              <Toggle
                label={VI.nhanThongBaoDay}
                checked={notifications.push}
                onChange={(v) => setNotifications(n => ({ ...n, push: v }))}
              />
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Thống kê</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <span className="text-sm font-medium">Tổng lịch hẹn</span>
                <span className="text-2xl font-bold">{appointments.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                <span className="text-sm font-medium">Hoàn thành</span>
                <span className="text-2xl font-bold">{appointments.filter(a => a.status === 'completed').length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Appointments History */}
      <section className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{VI.lichSuTuVan}</h3>
          </div>
          <select
            className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">{VI.tatCa}</option>
            <option value="pending">{VI.dangCho}</option>
            <option value="confirmed">{VI.daXacNhan}</option>
            <option value="in_progress">{VI.dangDienRa}</option>
            <option value="completed">{VI.daHoanThanh}</option>
            <option value="cancelled">{VI.daHuy}</option>
          </select>
        </div>
        {loadingAppts ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500">{VI.khongCoBuoi}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.slice(0, 5).map(appt => (
              <div key={appt.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border-2 border-gray-100 hover:border-cyan-300">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                    {appt.counselor_name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{appt.counselor_name || VI.chuyenGia}</p>
                    <p className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                      <span>{formatDate(appt.appointment_date)}</span>
                      <span>•</span>
                      <span>{appt.appointment_time}</span>
                      <span>•</span>
                      <span className={appt.appointment_type === 'online' ? 'text-cyan-600' : 'text-purple-600'}>
                        {appt.appointment_type === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </p>
                  </div>
                </div>
                <span className={"px-3 py-1.5 rounded-full text-xs font-bold shadow-md " + badgeClass(appt.status)}>
                  {labelStatus(appt.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </UserPage>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-cyan-300 transition-all">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-cyan-300 cursor-pointer transition-all group">
      <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</span>
      <button
        type="button"
        className={"relative w-12 h-6 rounded-full transition-all shadow-inner " + (checked ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-gray-300')}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span className={"absolute top-0.5 block w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform " + (checked ? 'translate-x-[26px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}

function Input({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  const defaultOptions = [
    { value: '', label: '--' },
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'N\u1EEF' },
    { value: 'other', label: 'Kh\u00E1c' }
  ];
  const opts = (Array.isArray(options) && options.length > 0) ? options : defaultOptions;
  return (
    <label className="block">
      <span className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
      >
        {opts.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </label>
  );
}

function badgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'confirmed') return 'bg-cyan-100 text-cyan-700';
  if (s === 'completed') return 'bg-cyan-100 text-cyan-700';
  if (s === 'in_progress') return 'bg-cyan-100 text-cyan-700';
  if (s === 'cancelled') return 'bg-gray-200 text-gray-700';
  return 'bg-orange-100 text-orange-700';
}

function labelStatus(status) {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return VI.dangCho;
  if (s === 'confirmed') return VI.daXacNhan;
  if (s === 'in_progress') return VI.dangDienRa;
  if (s === 'completed') return VI.daHoanThanh;
  if (s === 'cancelled') return VI.daHuy;
  return status || '';
}

// Convert various date formats to yyyy-mm-dd for <input type='date'>
function formatDateForInput(value) {
  try {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch { return ''; }
}

// Format date string từ database (YYYY-MM-DD) sang dd/mm/yyyy
function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
