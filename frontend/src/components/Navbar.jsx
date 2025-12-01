import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Account dropdown component
  const AccountDropdown = ({ profileLink, paymentLink, appointmentsLink }) => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-cyan-100 hover:bg-cyan-200 transition-colors duration-200"
        aria-label="Account menu"
      >
        <svg className="w-5 h-5 text-cyan-700" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-auto min-w-[12rem] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {appointmentsLink && (
            <Link
              to={appointmentsLink}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors whitespace-nowrap"
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h8" />
                </svg>
                Lịch hẹn
              </div>
            </Link>
          )}
          {paymentLink && (
            <Link
              to={paymentLink}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors whitespace-nowrap"
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-3.866 0-7 1.79-7 4v2a1 1 0 001 1h12a1 1 0 001-1v-2c0-2.21-3.134-4-7-4zm0 10a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
                Lịch sử thanh toán
              </div>
            </Link>
          )}
          {profileLink && (
            <Link
              to={profileLink}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors whitespace-nowrap"
              onClick={() => setIsDropdownOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Hồ sơ
              </div>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors whitespace-nowrap"
          >
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Đăng xuất
            </div>
          </button>
        </div>
      )}
    </div>
  );

  const navBtnBase = "px-3 py-2 rounded-md transition text-sm";
  const linkClass = (to) => {
    const active = location.pathname === to || location.pathname.startsWith(to + "/");
    return active
      ? `${navBtnBase} bg-cyan-50 text-cyan-700 font-medium`
      : `${navBtnBase} text-gray-700 hover:text-cyan-700 hover:bg-cyan-50`;
  };

  const userLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/specialties", label: "Chuyên ngành" },
    { to: "/patient/counselors", label: "Chuyên gia" },
    { to: "/patient/appointments", label: "Lịch hẹn" },
    { to: "/help", label: "Trợ giúp" },
  ];

  const counselorLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/counselor/schedule", label: "Lịch làm việc" },
    { to: "/counselor/manage-schedule", label: "Quản lý lịch" },
    { to: "/counselor/edit", label: "Chỉnh sửa hồ sơ" },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/users", label: "Người dùng" },
    { to: "/admin/counselors", label: "Chuyên gia" },
    { to: "/admin/counselor-applications", label: "Duyệt hồ sơ" },
    { to: "/admin/chats", label: "Quản lý Chat" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex justify-between items-center">
        <Link to="/" className="flex items-center group" aria-label="MindCare - Trang chủ">
          <span className="text-xl font-extrabold tracking-tight text-cyan-700">MindCare</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {!user && (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg border border-cyan-400 text-cyan-500 hover:bg-cyan-50 transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-cyan-400 text-white hover:bg-cyan-500 shadow-sm transition"
              >
                Đăng ký
              </Link>
            </>
          )}

          {user && user.role === "user" && (
            <>
              {userLinks
                .filter((l) => l.to !== "/patient/appointments")
                .map((l) => (
                  <Link key={l.to} className={linkClass(l.to)} to={l.to}>
                    {l.label}
                  </Link>
                ))}
              <NotificationBell />
              <AccountDropdown
                profileLink="/patient/profile"
                appointmentsLink="/patient/appointments"
                paymentLink="/patient/payments"
              />
            </>
          )}

          {user && user.role === "counselor" && (
            <>
              {counselorLinks.map((l) => (
                <Link key={l.to} className={linkClass(l.to)} to={l.to}>
                  {l.label}
                </Link>
              ))}
              <NotificationBell />
              <AccountDropdown />
            </>
          )}

          {user && user.role === "admin" && (
            <>
              {adminLinks.map((l) => (
                <Link key={l.to} className={linkClass(l.to)} to={l.to}>
                  {l.label}
                </Link>
              ))}
              <NotificationBell />
              <AccountDropdown />
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
