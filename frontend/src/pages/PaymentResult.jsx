import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import UserPage from '../components/UserPage';

export default function PaymentResult(){
  const { search } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const params = new URLSearchParams(search);
    const statusParam = (params.get('status') || '').toLowerCase();
    const rsp = params.get('vnp_ResponseCode');
    if (statusParam === 'success') setStatus('success');
    else if (statusParam === 'failed' || statusParam === 'error') setStatus('fail');
    else setStatus(rsp === '00' ? 'success' : 'fail');
  }, [search]);

  return (
    <UserPage title="Kết quả thanh toán">
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        {status === 'processing' && (
          <div className="text-gray-600">Đang xử lý...</div>
        )}
        {status === 'success' && (
          <>
            <div className="text-2xl font-semibold text-emerald-600 mb-2">✅ Thanh toán thành công</div>
            <div className="text-gray-700 mb-6">Lịch hẹn đã được xác nhận.</div>
            <button onClick={() => navigate('/patient/appointments')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Xem lịch hẹn</button>
          </>
        )}
        {status === 'fail' && (
          <>
            <div className="text-2xl font-semibold text-red-600 mb-2">❌ Thanh toán thất bại</div>
            <div className="text-gray-700 mb-6">Bạn có thể thử lại thanh toán từ danh sách lịch hẹn.</div>
            <button onClick={() => navigate('/patient/appointments')} className="px-4 py-2 bg-gray-800 text-white rounded-lg">Quay lại lịch hẹn</button>
          </>
        )}
      </div>
    </UserPage>
  );
}







