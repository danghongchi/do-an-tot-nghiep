# Website Đặt Lịch Khám & Tư Vấn Tâm Lý Trực Tuyến

## 🎯 Tổng quan

Hệ thống website đặt lịch khám và tư vấn tâm lý trực tuyến với đầy đủ tính năng:

- ✅ Đăng ký/Đăng nhập cho 3 loại người dùng (Patient, Counselor, Admin)
- ✅ Quản lý chuyên gia và chuyên ngành
- ✅ Đặt lịch hẹn trực tuyến/offline
- ✅ Chat tư vấn trực tuyến (Socket.io)
- ✅ Quản lý lịch hẹn và trạng thái
- ✅ Hệ thống đánh giá và thông báo

## 🚀 Cài đặt nhanh

### Windows:
```bash
# Chạy script tự động
start_system.bat
```

### Linux/Mac:
```bash
# Cấp quyền và chạy
chmod +x start_system.sh
./start_system.sh
```

### Cài đặt thủ công:

1. **Database:**
```bash
mysql -u root -p webdb < webdb.sql
mysql -u root -p webdb < fix_database.sql
# Vá bổ sung schema thanh toán (id + unique txn_ref)
mysql -u root -p webdb < fix_payments.sql
```

2. **Backend:** (Yêu cầu Node.js >= 18)
```bash
cd Backend
npm install
npm start
```

3. **Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Cấu hình

### Backend (server.js):
```javascript
// Cấu hình MySQL connection
pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'webdb'
});
```

### Frontend (.env):
```env
VITE_API_URL=http://localhost:5000/api
```

## 📊 Database Schema

### Bảng chính:
- `users` - Thông tin người dùng
- `counselor_profiles` - Hồ sơ chuyên gia
- `specialties` - Chuyên ngành
- `appointments` - Lịch hẹn
- `counselor_schedules` - Lịch làm việc
- `messages` - Tin nhắn chat
- `reviews` - Đánh giá
- `notifications` - Thông báo

## 🎨 Tính năng chính

### 👤 Người dùng (Patient)
- Đăng ký/Đăng nhập
- Xem danh sách chuyên gia
- Đặt lịch hẹn
- Chat tư vấn trực tuyến
- Xem lịch sử lịch hẹn
- Đánh giá chuyên gia

### 👨‍⚕️ Chuyên gia (Counselor)
- Quản lý hồ sơ cá nhân
- **Quản lý lịch làm việc** (tạo, sửa, xóa lịch)
- **Tạo lịch hàng loạt** cho nhiều ngày
- Xem lịch hẹn và cập nhật trạng thái
- Xác nhận/hủy lịch hẹn
- Chat tư vấn với bệnh nhân
- Bật/tắt khả năng nhận lịch hẹn

### 👨‍💼 Admin
- Quản lý người dùng
- Quản lý chuyên gia
- Quản lý chuyên ngành
- Xem thống kê hệ thống
- Quản lý lịch hẹn

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### Counselors
- `GET /api/counselors` - Danh sách chuyên gia
- `GET /api/counselors/:id` - Chi tiết chuyên gia
- `GET /api/counselors/:id/schedule` - Lịch rảnh

### Counselor Schedule Management
- `GET /api/counselor/schedules` - Lấy lịch làm việc của counselor
- `POST /api/counselor/schedules` - Tạo lịch làm việc mới
- `PUT /api/counselor/schedules/:id` - Cập nhật lịch làm việc
- `DELETE /api/counselor/schedules/:id` - Xóa lịch làm việc
- `POST /api/counselor/schedules/bulk` - Tạo lịch hàng loạt

### Appointments
- `POST /api/appointments` - Đặt lịch
- `GET /api/patient/appointments` - Lịch hẹn của patient
- `GET /api/counselor/appointments` - Lịch hẹn của counselor
- `PUT /api/appointments/:id/status` - Cập nhật trạng thái

### Admin
- `GET /api/admin/stats` - Thống kê
- `GET /api/admin/users` - Danh sách users
- `GET /api/admin/counselors` - Danh sách counselors

## 🛠️ Công nghệ sử dụng

### Backend:
- Node.js + Express
- MySQL + mysql2
- Socket.io (chat realtime)
- JWT (authentication)
- bcryptjs (password hashing)

### Frontend:
- React 19
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.io-client

## 📱 Giao diện

- Responsive design
- Modern UI với Tailwind CSS
- Dark/Light mode support
- Mobile-friendly

## 🔒 Bảo mật

- JWT authentication
- Password hashing với bcrypt
- CORS configuration
- Input validation
- SQL injection protection

## 🐛 Đã sửa lỗi

- ✅ Lỗi đặt lịch do foreign key sai
- ✅ Lỗi hiển thị ID counselor
- ✅ Lỗi API schedule
- ✅ Lỗi database schema
- ✅ Lỗi frontend routing
- ✅ **Thêm tính năng quản lý lịch làm việc cho counselor**
- ✅ **Tạo lịch hàng loạt và quản lý trạng thái lịch**

## 📞 Hỗ trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
1. MySQL đang chạy
2. Port 5000 và 3000 không bị chiếm dụng
3. Database đã được import đúng
4. Dependencies đã được cài đặt

## 📄 License

MIT License
