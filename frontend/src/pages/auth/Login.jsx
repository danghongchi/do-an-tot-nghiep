import React, { useState } from 'react';
import api from '../../services/api';
import { renderGoogleButton } from '../../services/socialAuth';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const nav = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
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
    
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data);
      
      // Redirect based on user role
      const userRole = res.data.user?.role;
      if (userRole === 'admin') {
        nav('/admin/dashboard');
      } else if (userRole === 'counselor') {
        nav('/counselor');
      } else {
        nav('/');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi đăng nhập';
      
      // Xử lý các loại lỗi cụ thể
      if (errorMessage.includes('không tồn tại') || errorMessage.includes('không tìm thấy')) {
        setErrors({ email: 'Email chưa được đăng ký' });
      } else if (errorMessage.includes('mật khẩu') || errorMessage.includes('password')) {
        setErrors({ password: 'Mật khẩu không chính xác' });
      } else if (errorMessage.includes('email')) {
        setErrors({ email: errorMessage });
      } else {
        setErrors({ email: errorMessage });
      }
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chào mừng trở lại</h1>
          <p className="text-sm text-gray-600 mt-1">Đăng nhập để tiếp tục đồng hành cùng MindCare</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="sr-only">Đăng nhập</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e)=>{setEmail(e.target.value); setErrors({...errors, email: ''});}}
                placeholder="you@example.com"
                className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <div className="relative">
                <input
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e)=>{setPassword(e.target.value); setErrors({...errors, password: ''});}}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:border-cyan-500 focus:ring-cyan-500 pr-12 px-3 py-2 rounded-lg outline-none transition appearance-none`}
                />
                <button
                  type="button"
                  onClick={()=>setShowPassword((s)=>!s)}
                  className="absolute inset-y-0 right-3 z-10 flex items-center p-0 text-gray-500 hover:text-cyan-600 focus:outline-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    // eye-off icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                      <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 001.4-4.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.2 6.2A10.4 10.4 0 002 12c1.3 4.1 5.1 7 10 7 1.9 0 3.7-.5 5.2-1.4" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.9 5.1c.68-.07 1.08-.1 2.1-.1 4.9 0 8.7 2.9 10 7-.5 1.6-1.6 3.2-3 4.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    // eye icon
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                      <path d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7s-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            <button className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-sm">Đăng nhập</button>
          </form>

          {/* Social login */}
          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="flex items-center">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-2 text-xs text-gray-500">hoặc</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div
              id="gsi-btn-login"
              className="flex justify-center min-h-[40px]"
              ref={async (el)=>{
                if (!el) return;
                try {
                  await renderGoogleButton(el, async (idToken)=>{
                    try {
                      if (!idToken) { alert('Không nhận được Google token'); return; }
                      try { window.lastGoogleIdToken = idToken; } catch {}
                      const res = await api.post('/auth/oauth', { provider: 'google', token: idToken });
                      login(res.data);
                      
                      // Redirect based on user role
                      const userRole = res.data.user?.role;
                      if (userRole === 'admin') {
                        nav('/admin/dashboard');
                      } else if (userRole === 'counselor') {
                        nav('/counselor');
                      } else {
                        nav('/');
                      }
                    } catch (e) { console.error(e); alert(e.response?.data?.message || 'Đăng nhập Google thất bại'); }
                  });
                } catch {}
              }}
            />
          </div>
          <div className="mt-4 text-sm flex items-center justify-between">
            <Link to="/forgot-password" className="text-cyan-700 hover:text-cyan-800">Quên mật khẩu?</Link>
            <p>
              Chưa có tài khoản?{' '}
              <Link to="/register" className="text-cyan-700 hover:text-cyan-800 font-medium">Đăng ký</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
