import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("token"); // kiểm tra đã đăng nhập chưa
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
