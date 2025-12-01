import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function EditProfile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    clinic_address: "",
    avatar_url: "",
    experience_years: "",
    experience_description: "",
    online_price: "",
    offline_price: "",
    working_hours: "",
    specialty_id: "",
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        
        // Load specialties first
        console.log("Loading specialties...");
        const specResponse = await api.get("/specialties");
        console.log("Specialties loaded:", specResponse.data);
        setSpecialties(specResponse.data || []);

        // Load profile
        console.log("Loading profile for user:", user.id);
        const profileResponse = await api.get(`/counselors/user/${user.id}`);
        console.log("Profile loaded:", profileResponse.data);
        
        const profileData = profileResponse.data;
        setProfile({
          full_name: profileData.full_name || user.full_name || "",
          email: profileData.email || user.email || "",
          phone: profileData.phone || user.phone || "",
          clinic_address: profileData.clinic_address || "",
          avatar_url: profileData.avatar_url || "",
          experience_years: profileData.experience_years || "",
          experience_description: profileData.experience_description || "",
          online_price: profileData.online_price || "",
          offline_price: profileData.offline_price || "",
          working_hours: profileData.working_hours || "",
          specialty_id: profileData.specialty_id || "",
        });
        
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.response?.data?.message || err.message || "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadData();
    }
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadRes = await api.post(`/counselors/user/${user.id}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const uploadedUrl = uploadRes.data?.avatar_url;
        if (uploadedUrl) {
          profile.avatar_url = uploadedUrl;
        }
      }

      const payload = { ...profile };
      if (!payload.specialty_id) payload.specialty_id = null;

      const response = await api.put(`/counselors/user/${user.id}`, payload);

      // Cập nhật user context với profile mới
      if (response.data.profile) {
        login({
          token: localStorage.getItem("mc_token"),
          user: { ...user, ...response.data.profile },
        });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000); // Hide success message after 5 seconds
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      setError("Cập nhật thất bại: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-slate-500 to-slate-600 text-white px-6 py-3 rounded-lg hover:from-slate-600 hover:to-slate-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-blue-600 p-8 rounded-2xl text-white shadow-xl">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Chỉnh sửa hồ sơ
            </h1>
            <p className="text-gray-100 text-xl">Cập nhật thông tin cá nhân và chuyên môn của bạn</p>
          </div>
        </div>
      
        {/* Thông báo trạng thái hồ sơ */}
        {!profile.clinic_address && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <span className="text-2xl text-blue-600">🎉</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-blue-800">Chào mừng!</h3>
                <p className="text-blue-700">
                  Bạn chưa có hồ sơ counselor. Hãy điền thông tin bên dưới để tạo hồ sơ mới.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Thành công!</h3>
                <p className="text-green-700">Hồ sơ của bạn đã được cập nhật thành công.</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ảnh đại diện
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <input 
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                    name="avatar_url" 
                    placeholder="https://... (hoặc để trống nếu đã tải ảnh)"
                    value={profile.avatar_url} 
                    onChange={handleChange} 
                  />
                </div>
                {profile.avatar_url && (
                  <div className="mt-3">
                    <img 
                      src={(String(profile.avatar_url).startsWith('http') ? profile.avatar_url : ((import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api','') : 'http://localhost:5000') + profile.avatar_url))}
                      alt="avatar preview" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200" 
                      onError={(e)=>{ e.currentTarget.onerror = null; e.currentTarget.src = 'https://ui-avatars.com/api/?background=E5E7EB&color=374151&name=' + encodeURIComponent(profile.full_name || 'User'); }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Họ tên
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="full_name" 
                  placeholder="Họ tên"
                  value={profile.full_name} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="email" 
                  placeholder="Email"
                  value={profile.email} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Số điện thoại
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="phone" 
                  placeholder="Số điện thoại"
                  value={profile.phone} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                <svg className="w-4 h-4 inline mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Chuyên ngành
              </label>
              <select
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                name="specialty_id"
                value={profile.specialty_id || ""}
                onChange={handleChange}
              >
                <option value="">-- Chọn chuyên ngành --</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {specialties.length === 0 && (
                <p className="text-red-500 text-sm mt-2">
                  Không có chuyên ngành nào được tải
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                <svg className="w-4 h-4 inline mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Địa chỉ phòng khám
              </label>
              <input 
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                name="clinic_address" 
                placeholder="Địa chỉ phòng khám"
                value={profile.clinic_address} 
                onChange={handleChange} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Số năm kinh nghiệm
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="experience_years" 
                  placeholder="Số năm kinh nghiệm"
                  value={profile.experience_years} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Giá tư vấn online
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="online_price" 
                  placeholder="Giá tư vấn online"
                  value={profile.online_price} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                <svg className="w-4 h-4 inline mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Mô tả kinh nghiệm
              </label>
              <textarea 
                className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                name="experience_description" 
                placeholder="Mô tả kinh nghiệm"
                rows="4"
                value={profile.experience_description} 
                onChange={handleChange} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Giá tư vấn trực tiếp
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="offline_price" 
                  placeholder="Giá tư vấn trực tiếp"
                  value={profile.offline_price} 
                  onChange={handleChange} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  <svg className="w-4 h-4 inline mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Giờ làm việc
                </label>
                <input 
                  className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  name="working_hours" 
                  placeholder="Giờ làm việc"
                  value={profile.working_hours} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="col-span-full">
              <button 
                type="submit" 
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang lưu...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Lưu thay đổi
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
