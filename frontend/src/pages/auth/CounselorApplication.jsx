import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function CounselorApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [form, setForm] = useState({
    specialty_id: '',
    experience_years: '',
    experience_description: '',
    clinic_address: '',
    online_price: '',
    offline_price: '',
    working_hours: '',
    qualification_documents: [],
    identity_documents: [],
    license_documents: [],
    payment_info: ''
  });

  // Kiểm tra quyền truy cập
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'counselor' || user.role === 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // Lấy danh sách chuyên ngành
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        setSpecialties(response.data);
      } catch (error) {
        console.error('Lỗi lấy danh sách chuyên ngành:', error);
      }
    };
    fetchSpecialties();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, field) => {
    const files = Array.from(e.target.files);
    setForm(prev => ({
      ...prev,
      [field]: [...prev[field], ...files]
    }));
  };

  const removeFile = (field, index) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Tạo FormData để gửi file
      const formData = new FormData();
      
      // Thêm thông tin cơ bản
      Object.keys(form).forEach(key => {
        if (key.includes('documents')) {
          // Xử lý file uploads
          form[key].forEach((file) => {
            formData.append(`${key}`, file);
          });
        } else {
          formData.append(key, form[key]);
        }
      });

      // Gửi với axios qua api client (baseURL http://localhost:5000/api)
      await api.post('/counselor-applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Nộp hồ sơ thành công! Hồ sơ của bạn đang chờ admin duyệt.');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Lỗi khi nộp hồ sơ';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role === 'counselor' || user.role === 'admin') {
    return null;
  }

  return (
    <div className="w-full flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Nộp hồ sơ trở thành chuyên gia</h2>
          <p className="text-gray-600 mt-2">
            Điền đầy đủ thông tin để admin có thể duyệt hồ sơ của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin chuyên môn */}
          <div className="bg-cyan-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-cyan-800">Thông tin chuyên môn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chuyên ngành *
                </label>
                <select
                  name="specialty_id"
                  value={form.specialty_id}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn chuyên ngành</option>
                  {specialties.map(specialty => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số năm kinh nghiệm *
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={form.experience_years}
                  onChange={handleChange}
                  min="0"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả kinh nghiệm *
                </label>
                <textarea
                  name="experience_description"
                  value={form.experience_description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mô tả chi tiết về kinh nghiệm làm việc, chuyên môn của bạn..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Thông tin phòng khám */}
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-800">Thông tin phòng khám</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ phòng khám
                </label>
                <textarea
                  name="clinic_address"
                  value={form.clinic_address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ phòng khám (nếu có)"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá tư vấn online (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="online_price"
                    value={form.online_price}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: 500000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá tư vấn tại phòng khám (VNĐ)
                  </label>
                  <input
                    type="number"
                    name="offline_price"
                    value={form.offline_price}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ví dụ: 800000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lịch làm việc có thể nhận
                </label>
                <textarea
                  name="working_hours"
                  value={form.working_hours}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ví dụ: Thứ 2-6: 8:00-17:00, Chủ nhật: 9:00-12:00"
                />
              </div>
            </div>
          </div>

          {/* Tài liệu xác minh */}
          <div className="bg-cyan-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-cyan-800">Tài liệu xác minh</h3>
            <div className="space-y-6">
              {/* Bằng cấp/chứng chỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bằng cấp/Chứng chỉ
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'qualification_documents')}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-2">
                  {form.qualification_documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile('qualification_documents', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CMND/CCCD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CMND/CCCD
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'identity_documents')}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-2">
                  {form.identity_documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile('identity_documents', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Giấy phép hành nghề */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giấy phép hành nghề (nếu có)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, 'license_documents')}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="mt-2">
                  {form.license_documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <span className="text-sm text-gray-600">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile('license_documents', index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="bg-orange-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-orange-800">Thông tin thanh toán</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin nhận tiền
              </label>
              <textarea
                name="payment_info"
                value={form.payment_info}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ví dụ: Số tài khoản ngân hàng, tên chủ tài khoản, ngân hàng..."
              />
            </div>
          </div>

          {/* Nút submit */}
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang nộp hồ sơ...' : 'Nộp hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
