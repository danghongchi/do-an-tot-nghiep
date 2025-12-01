// Utility helper functions

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date to Vietnamese format
const formatDateVN = (date) => {
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  };
  return new Date(date).toLocaleString('vi-VN', options);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Vietnamese format)
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Sanitize string (remove special characters)
const sanitizeString = (str) => {
  return str.replace(/[<>\"'%;()&+]/g, '');
};

// Generate appointment ID
const generateAppointmentId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `APT_${timestamp}_${random}`.toUpperCase();
};

// Generate chat ID
const generateChatId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `CHAT_${timestamp}_${random}`.toUpperCase();
};

// Check if time is in business hours (8AM - 8PM)
const isBusinessHours = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 8 && hour < 20;
};

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Format currency (Vietnamese Dong)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Truncate text
const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

module.exports = {
  generateRandomString,
  formatDateVN,
  isValidEmail,
  isValidPhone,
  sanitizeString,
  generateAppointmentId,
  generateChatId,
  isBusinessHours,
  calculateAge,
  formatCurrency,
  truncateText
};












