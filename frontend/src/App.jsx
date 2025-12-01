import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import Home from './components/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import CounselorApplication from './pages/auth/CounselorApplication';
import PatientHome from './pages/patient/Home';
import CounselorList from './pages/patient/CounselorList';
import CounselorDetail from './pages/patient/CounselorDetail';
import MyAppointments from './pages/patient/MyAppointments';
import PatientChatRoom from './pages/patient/ChatRoom';
import BookAppointment from './pages/patient/BookAppointment';
import CounselorHome from './pages/counselor/Home';
import CounselorSchedule from './pages/counselor/MySchedule';
import ManageSchedule from './pages/counselor/ManageSchedule';
import CounselorEdit from './pages/counselor/EditProfile';
import CounselorChatRoom from './pages/counselor/ChatRoom';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminCounselors from './pages/admin/Counselors';
import AdminChats from './pages/admin/Chats';
import AdminChatDetail from './pages/admin/ChatDetail';
import AdminCounselorApplications from './pages/admin/CounselorApplications';
import AdminSpecialties from './pages/admin/Specialties';
import PrivateRoute from './components/PrivateRoute';
import Specialties from './pages/Specialties';
import PaymentResult from './pages/PaymentResult';
import PatientProfile from './pages/patient/Profile';
import PaymentHistory from './pages/patient/PaymentHistory';
import Help from './pages/Help';
import About from './pages/About';
import Contact from './pages/Contact';

// Admin Layout Wrapper
function AdminLayoutWrapper({ children }) {
  return (
    <PrivateRoute allowedRoles={['admin']}>
      <AdminLayout>{children}</AdminLayout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Admin Routes - No Navbar/Footer */}
      <Route
        path="/admin/*"
        element={
          <AdminLayoutWrapper>
            <Routes>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="counselors" element={<AdminCounselors />} />
              <Route path="counselor-applications" element={<AdminCounselorApplications />} />
              <Route path="specialties" element={<AdminSpecialties />} />
              <Route path="chats" element={<AdminChats />} />
              <Route path="chats/:appointmentId" element={<AdminChatDetail />} />
            </Routes>
          </AdminLayoutWrapper>
        }
      />

      {/* All Other Routes - With Navbar/Footer */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col bg-comfort-gradient">
            <Navbar />
            <main className="flex-1 w-full">
              <Routes>
                {/* Home mở cho tất cả */}
                <Route path="/" element={<Home />} />

                {/* Public Routes */}
                <Route path="/counselors" element={<CounselorList />} />
                <Route path="/counselor/:id" element={<CounselorDetail />} />
                <Route path="/help" element={<Help />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/counselor-application" element={<CounselorApplication />} />

                {/* Patient */}
                <Route
                  path="/patient/counselors"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <CounselorList />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/patient/counselor/:id"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <CounselorDetail />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/patient/book/:counselorId"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <BookAppointment />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/patient/appointments"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <MyAppointments />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/patient/payments"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <PaymentHistory />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/patient/chat/:appointmentId"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <PatientChatRoom />
                    </PrivateRoute>
                  }
                />
                <Route path="/payment/result" element={<PaymentResult />} />
                <Route path="/specialties" element={<Specialties />} />
                <Route
                  path="/patient/profile"
                  element={
                    <PrivateRoute allowedRoles={['user']}>
                      <PatientProfile />
                    </PrivateRoute>
                  }
                />

                {/* Counselor */}
                <Route
                  path="/counselor"
                  element={
                    <PrivateRoute allowedRoles={['counselor']}>
                      <CounselorHome />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/counselor/schedule"
                  element={
                    <PrivateRoute allowedRoles={['counselor']}>
                      <CounselorSchedule />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/counselor/manage-schedule"
                  element={
                    <PrivateRoute allowedRoles={['counselor']}>
                      <ManageSchedule />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/counselor/edit"
                  element={
                    <PrivateRoute allowedRoles={['counselor']}>
                      <CounselorEdit />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/counselor/chat/:appointmentId"
                  element={
                    <PrivateRoute allowedRoles={['counselor']}>
                      <CounselorChatRoom />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}
