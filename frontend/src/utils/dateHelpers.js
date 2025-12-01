/**
 * Format date string từ database (YYYY-MM-DD hoặc ISO format)
 * thành định dạng Việt Nam (dd/mm/yyyy)
 * 
 * Lưu ý: Hàm này xử lý đúng timezone để tránh lỗi ngày bị lùi 1 ngày
 * khi parse date string từ database
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Nếu là ISO string với timezone, parse bình thường
  if (dateString.includes('T') || dateString.includes('Z')) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  }
  
  // Nếu là string YYYY-MM-DD từ database, parse theo local timezone
  // để tránh lỗi timezone (UTC vs local time)
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
};

/**
 * Format datetime string từ database thành định dạng Việt Nam
 * (dd/mm/yyyy HH:mm)
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Chuyển date string từ input type="date" (YYYY-MM-DD)
 * sang format phù hợp để gửi lên backend
 */
export const normalizeDateForBackend = (dateString) => {
  if (!dateString) return '';
  // Input type="date" đã cho format YYYY-MM-DD đúng rồi
  return dateString;
};
