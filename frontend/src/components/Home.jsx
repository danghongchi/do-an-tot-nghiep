import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PatientHome from '../pages/patient/Home';
import CounselorHome from '../pages/counselor/Home';
import ApplicationStatus from './ApplicationStatus';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect admin to admin panel
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  // Nếu chưa đăng nhập, hiển thị trang patient home
  if (!user) {
    return <PatientHome />;
  }

  // Nếu là admin, đang redirect...
  if (user.role === 'admin') {
    return null; // hoặc loading spinner
  }

  // Hiển thị trang phù hợp với role
  switch (user.role) {
    case 'user':
      return (
        <div>
          <ApplicationStatus />
          <PatientHome />
        </div>
      );
    case 'counselor':
      return <CounselorHome />;
    default:
      return (
        <div>
          <ApplicationStatus />
          <PatientHome />
        </div>
      );
  }
}

