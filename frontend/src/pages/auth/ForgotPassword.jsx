import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validation
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      setLoading(false);
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      
      // Trong development mode, hiển thị link reset
      if (response.data.resetLink) {
        setMessage(prev => prev + `\n\nLink reset (chỉ trong development): ${response.data.resetLink}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center min-h-[70vh] px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quên mật khẩu</h1>
          <p className="text-sm text-gray-600 mt-1">Nhập email của bạn để nhận link reset mật khẩu</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full border border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 rounded-lg outline-none transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-orange-50 border border-orange-200 text-orange-600 px-4 py-3 rounded whitespace-pre-line">
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-500 text-white rounded-lg font-medium transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : 'Gửi link reset'}
            </button>
          </div>

          </form>
          
          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-cyan-700 hover:text-cyan-800"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

