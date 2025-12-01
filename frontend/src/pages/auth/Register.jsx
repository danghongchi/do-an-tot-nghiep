import React, { useState } from 'react';
import api from '../../services/api';
import { googleGetIdToken, renderGoogleButton } from '../../services/socialAuth';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [form, setForm] = useState({ 
    full_name:'', 
    email:'', 
    password:'', 
    phone:'', 
    gender:'',
    date_of_birth:'',
    role:'user',
    wants_to_be_counselor: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const nav = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.full_name.trim()) {
      newErrors.full_name = 'Vui lòng nhập họ và tên';
    } else if (form.full_name.trim().length < 3) {
      newErrors.full_name = 'Họ tên phải có ít nhất 3 ký tự';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!form.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại phải có 10 chữ số';
    }
    
    if (!form.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (form.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      
      // Lưu token và user info
      if (res.data.token) {
        localStorage.setItem('mc_token', res.data.token);
        localStorage.setItem('mc_user', JSON.stringify(res.data.user));
      }
      
      if (form.wants_to_be_counselor) {
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi nộp hồ sơ chuyên gia.');
        nav('/counselor-application');
      } else {
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        nav('/login');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi đăng ký';
      
      // Xử lý các loại lỗi cụ thể
      if (errorMessage.includes('Email') && errorMessage.includes('tồn tại')) {
        setErrors({ email: 'Email này đã được đăng ký' });
      } else if (errorMessage.includes('số điện thoại') || errorMessage.includes('phone')) {
        setErrors({ phone: errorMessage });
      } else if (errorMessage.includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.includes('mật khẩu') || errorMessage.includes('password')) {
        setErrors({ password: errorMessage });
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value});
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Đăng ký tài khoản</h2>
          <p className="text-sm text-gray-600 mt-2">Tham gia MindCare để được tư vấn tâm lý chuyên nghiệp</p>
        </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="bg-cyan-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-cyan-800">Thông tin cơ bản</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <input 
                name="full_name"
                value={form.full_name} 
                onChange={handleChange} 
                placeholder="Nhập họ và tên đầy đủ" 
                className={`w-full border ${errors.full_name ? 'border-red-500' : 'border-gray-200'} focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition`}
              />
              {errors.full_name && (
                <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input 
                name="email"
                type="email"
                value={form.email} 
                onChange={handleChange} 
                placeholder="example@email.com" 
                className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
              <input 
                name="phone"
                type="tel"
                value={form.phone} 
                onChange={handleChange} 
                placeholder="0123456789" 
                className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-200'} focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition`}
              />
              {errors.phone && (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <input 
                name="password"
                type="password" 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Tối thiểu 6 ký tự" 
                className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition`}
              />
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin cá nhân */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-orange-800">Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
              <select 
                name="gender"
                value={form.gender} 
                onChange={handleChange} 
                className="w-full border border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
              <input 
                name="date_of_birth"
                type="date" 
                value={form.date_of_birth} 
                onChange={handleChange} 
                className="w-full border border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition" 
              />
            </div>
          </div>
        </div>

        {/* Thông báo về luồng đăng ký */}
        <div className="bg-cyan-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-cyan-800">Thông tin đăng ký</h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-cyan-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-cyan-600 text-sm">ℹ</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  Tất cả người dùng đều đăng ký với tài khoản <strong>Người dùng</strong> trước.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-orange-600 text-sm">✓</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  Nếu bạn muốn trở thành <strong>Chuyên gia tư vấn</strong>, hãy đánh dấu vào ô bên dưới.
                </p>
              </div>
            </div>
          </div>
          
          {/* Checkbox muốn trở thành chuyên gia */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <label className="flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="wants_to_be_counselor"
                checked={form.wants_to_be_counselor}
                onChange={(e) => setForm({...form, wants_to_be_counselor: e.target.checked})}
                className="mr-3 h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
              />
              <div>
                <div className="font-medium text-gray-800">Tôi muốn trở thành chuyên gia tư vấn</div>
                <div className="text-sm text-gray-600">
                  Sau khi đăng ký, bạn sẽ được chuyển đến trang nộp hồ sơ chuyên gia để admin duyệt.
                </div>
              </div>
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
        </button>

        {/* Social sign up (login if existing) */}
        <div className="grid grid-cols-1 gap-3 mt-3">
          <div id="gsi-btn-register" className="flex justify-center min-h-[40px]" ref={async (el)=>{
            if (!el) return;
            try {
              await renderGoogleButton(el, async (idToken)=>{
                try {
                  if (!idToken) { alert('Không nhận được Google token'); return; }
                  const res = await api.post('/auth/oauth', { provider: 'google', token: idToken });
                  localStorage.setItem('mc_token', res.data.token);
                  localStorage.setItem('mc_user', JSON.stringify(res.data.user));
                  nav('/');
                } catch (e) { console.error(e); alert(e.response?.data?.message || 'Đăng ký/Đăng nhập Google thất bại'); }
              });
            } catch {}
          }} />
        </div>

        <div className="text-center">
          <p className="text-gray-600">
            Đã có tài khoản? 
            <button 
              type="button"
              onClick={() => nav('/login')}
              className="text-cyan-700 hover:text-cyan-800 ml-1"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </form>
      </div>
    </div>
  );
}
