import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function EditProfileNew() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    clinic_address: "",
    experience_years: "",
    experience_description: "",
    online_price: "",
    offline_price: "",
    working_hours: "",
    specialty_id: "",
  });
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        setProfile({
          full_name: profileResponse.data.full_name || user.full_name || "",
          email: profileResponse.data.email || user.email || "",
          phone: profileResponse.data.phone || user.phone || "",
          clinic_address: profileResponse.data.clinic_address || "",
          experience_years: profileResponse.data.experience_years || "",
          experience_description: profileResponse.data.experience_description || "",
          online_price: profileResponse.data.online_price || "",
          offline_price: profileResponse.data.offline_price || "",
          working_hours: profileResponse.data.working_hours || "",
          specialty_id: profileResponse.data.specialty_id || "",
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
    try {
      const payload = { ...profile };
      if (!payload.specialty_id) payload.specialty_id = null;

      const updated = await api.put(`/counselors/user/${user.id}`, payload);

      login({
        token: localStorage.getItem("mc_token"),
        user: { ...user, ...updated.data.profile },
      });

      alert("Cập nhật hồ sơ thành công!");
    } catch (err) {
      console.error("Lỗi khi cập nhật:", err);
      alert("Cập nhật thất bại: " + (err.response?.data?.message || err.message));
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
      <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
        <div className="text-red-500 text-center">
          <h3 className="font-bold mb-2">Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Chỉnh sửa hồ sơ</h2>
      
      {/* Debug info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <p><strong>Debug:</strong> {specialties.length} chuyên ngành đã tải</p>
        <p><strong>User ID:</strong> {user?.id}</p>
        <p><strong>Selected Specialty:</strong> {profile.specialty_id}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ tên
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="full_name" 
            placeholder="Họ tên"
            value={profile.full_name} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="email" 
            placeholder="Email"
            value={profile.email} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="phone" 
            placeholder="Số điện thoại"
            value={profile.phone} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chuyên ngành
          </label>
          <select
            className="w-full border p-2 rounded"
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
            <p className="text-red-500 text-sm mt-1">
              Không có chuyên ngành nào được tải
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Địa chỉ phòng khám
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="clinic_address" 
            placeholder="Địa chỉ phòng khám"
            value={profile.clinic_address} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số năm kinh nghiệm
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="experience_years" 
            placeholder="Số năm kinh nghiệm"
            value={profile.experience_years} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mô tả kinh nghiệm
          </label>
          <textarea 
            className="w-full border p-2 rounded" 
            name="experience_description" 
            placeholder="Mô tả kinh nghiệm"
            value={profile.experience_description} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá tư vấn online
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="online_price" 
            placeholder="Giá tư vấn online"
            value={profile.online_price} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá tư vấn trực tiếp
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="offline_price" 
            placeholder="Giá tư vấn trực tiếp"
            value={profile.offline_price} 
            onChange={handleChange} 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giờ làm việc
          </label>
          <input 
            className="w-full border p-2 rounded" 
            name="working_hours" 
            placeholder="Giờ làm việc"
            value={profile.working_hours} 
            onChange={handleChange} 
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}


