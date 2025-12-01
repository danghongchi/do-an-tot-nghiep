// Application constants

// User roles
const USER_ROLES = {
  USER: 'user',
  COUNSELOR: 'counselor',
  ADMIN: 'admin'
};

// Appointment statuses
const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
};

// Anonymous chat statuses
const CHAT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

// Counselor application statuses
const APPLICATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Appointment types
const APPOINTMENT_TYPES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  PHONE: 'phone'
};

// Chat priorities
const CHAT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// File upload limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  MAX_FILES_PER_FIELD: {
    qualification_documents: 10,
    identity_documents: 5,
    license_documents: 5
  }
};

// Email rate limiting
const EMAIL_RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_EMAILS: 3 // Maximum 3 emails per window
};

// JWT settings
const JWT_SETTINGS = {
  EXPIRES_IN: '7d',
  REFRESH_EXPIRES_IN: '30d'
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Business hours
const BUSINESS_HOURS = {
  START: 8, // 8 AM
  END: 20   // 8 PM
};

// Database table names
const TABLES = {
  USERS: 'users',
  COUNSELORS: 'counselors',
  SPECIALTIES: 'specialties',
  APPOINTMENTS: 'appointments',
  APPOINTMENT_MESSAGES: 'appointment_messages',
  COUNSELOR_SCHEDULES: 'counselor_schedules',
  COUNSELOR_APPLICATIONS: 'counselor_applications',
  ANONYMOUS_CHATS: 'anonymous_chats',
  ANONYMOUS_CHAT_MESSAGES: 'anonymous_chat_messages',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  AI_CHAT_HISTORY: 'ai_chat_history'
};

// Error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Không có quyền truy cập',
  FORBIDDEN: 'Truy cập bị từ chối',
  NOT_FOUND: 'Không tìm thấy dữ liệu',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
  SERVER_ERROR: 'Lỗi server',
  EMAIL_EXISTS: 'Email đã tồn tại',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  TOKEN_EXPIRED: 'Token đã hết hạn',
  FILE_TOO_LARGE: 'File quá lớn',
  INVALID_FILE_TYPE: 'Loại file không được hỗ trợ',
  RATE_LIMIT_EXCEEDED: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
};

// Success messages
const SUCCESS_MESSAGES = {
  REGISTER_SUCCESS: 'Đăng ký thành công',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGOUT_SUCCESS: 'Đăng xuất thành công',
  UPDATE_SUCCESS: 'Cập nhật thành công',
  DELETE_SUCCESS: 'Xóa thành công',
  CREATE_SUCCESS: 'Tạo thành công',
  EMAIL_SENT: 'Email đã được gửi',
  PASSWORD_RESET: 'Mật khẩu đã được đặt lại',
  APPOINTMENT_BOOKED: 'Đặt lịch thành công',
  CHAT_CREATED: 'Tạo chat thành công',
  MESSAGE_SENT: 'Gửi tin nhắn thành công'
};

module.exports = {
  USER_ROLES,
  APPOINTMENT_STATUS,
  CHAT_STATUS,
  APPLICATION_STATUS,
  APPOINTMENT_TYPES,
  CHAT_PRIORITIES,
  UPLOAD_LIMITS,
  EMAIL_RATE_LIMIT,
  JWT_SETTINGS,
  PAGINATION,
  BUSINESS_HOURS,
  TABLES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};












