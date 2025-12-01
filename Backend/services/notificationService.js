const { query } = require('../config/database');
const { sendPaymentSuccessEmail } = require('./emailService');

// Ensure notifications table exists (idempotent)
async function ensureNotificationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'system',
      priority VARCHAR(20) NOT NULL DEFAULT 'medium',
      data TEXT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_created (user_id, created_at),
      INDEX idx_user_unread (user_id, is_read),
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// Best-effort normalization for Vietnamese text that may arrive as
// literal \uXXXX escapes or mojibake (latin1). This fixes display issues
// when upstream sources saved strings with the wrong encoding.
function normalizeText(input) {
  try {
    if (typeof input !== 'string') return input;
    let s = input;
    // 1) Decode literal \uXXXX sequences if present
    if (/\\u[0-9a-fA-F]{4}/.test(s)) {
      try {
        // Wrap as JSON string to decode escapes safely
        const decoded = JSON.parse('"' + s.replace(/"/g, '\\"') + '"');
        if (typeof decoded === 'string') s = decoded;
      } catch {}
    }
    // 2) Fix common latin1 mojibake (Ã, Â, …)
    if (/[ÃÂÊÐÒØÝ]/.test(s)) {
      try { s = Buffer.from(s, 'latin1').toString('utf8'); } catch {}
    }
    return s;
  } catch { return input; }
}

// Socket service will be injected by server to avoid circular require
let socketService = null;
function setSocketService(instance) {
  socketService = instance;
}

async function createNotification({ user_id, title, message, type = 'system', priority = 'medium', data = null }) {
  await ensureNotificationsTable();
  // Normalize potentially mis-encoded text
  title = normalizeText(title);
  message = normalizeText(message);
  const dataString = data ? JSON.stringify(data) : null;
  const result = await query(
    'INSERT INTO notifications (user_id, title, message, type, priority, data, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, NOW())',
    [user_id, title, message, type, priority, dataString]
  );
  const id = result.insertId;
  let [row] = await query('SELECT * FROM notifications WHERE id = ?', [id]);
  // Normalize again on the way out (defensive)
  if (row) {
    row.title = normalizeText(row.title);
    row.message = normalizeText(row.message);
  }

  // Emit via socket if available (injected from server)
  if (socketService) {
    try {
      socketService.sendNotificationToUser(user_id, row);
    } catch (_) {}
  }

  // Side-effect: gửi email xác nhận thanh toán cho thông báo thành công
  try {
    const isPayment = String(type || '').toLowerCase() === 'payment';
    const isHigh = String(priority || '').toLowerCase() === 'high';
    const payload = dataString ? JSON.parse(dataString) : (data || {});
    if (isPayment && isHigh && payload && payload.appointment_id && (payload.amount !== undefined)) {
      // Lấy thông tin người dùng và lịch hẹn
      let userEmail = null, userName = null, appointment = null, counselorName = null;
      try {
        const u = await query('SELECT email, full_name FROM users WHERE id = ? LIMIT 1', [user_id]);
        if (u && u[0]) { userEmail = u[0].email; userName = u[0].full_name; }
      } catch (_) {}
      try {
        const apps = await query('SELECT a.*, cp.user_id AS counselor_user_id FROM appointments a JOIN counselor_profiles cp ON cp.id = a.counselor_id WHERE a.id = ? LIMIT 1', [payload.appointment_id]);
        if (apps && apps[0]) appointment = apps[0];
      } catch (_) {}
      try {
        if (appointment && appointment.counselor_id) {
          const cu = await query('SELECT u.full_name FROM users u JOIN counselor_profiles cp ON cp.user_id = u.id WHERE cp.id = ? LIMIT 1', [appointment.counselor_id]);
          if (cu && cu[0]) counselorName = cu[0].full_name;
        }
      } catch (_) {}

      if (userEmail) {
        await sendPaymentSuccessEmail(userEmail, {
          userName,
          appointmentId: Number(payload.appointment_id),
          appointmentDate: appointment?.appointment_date,
          appointmentTime: appointment?.appointment_time,
          appointmentType: appointment?.appointment_type,
          counselorName,
          amount: payload.amount,
          meetingUrl: appointment?.meeting_url,
          gateway: 'VNPAY'
        });
      }
    }
  } catch (e) {
    console.error('[Notification] Error while sending payment success email:', e);
  }

  return row;
}

async function markAsRead(id, userId) {
  await ensureNotificationsTable();
  await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?', [id, userId]);
}

async function markAllAsRead(userId) {
  await ensureNotificationsTable();
  await query('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0', [userId]);
}

async function listNotifications(userId, limit = 20) {
  await ensureNotificationsTable();
  const rows = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, Number(limit) || 20]);
  return rows.map(r => ({
    ...r,
    title: normalizeText(r.title),
    message: normalizeText(r.message)
  }));
}

async function deleteReadNotifications(userId) {
  await ensureNotificationsTable();
  await query('DELETE FROM notifications WHERE user_id = ? AND is_read = 1', [userId]);
}

async function deleteNotification(id, userId) {
  await ensureNotificationsTable();
  await query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
}

module.exports = {
  createNotification,
  markAsRead,
  markAllAsRead,
  listNotifications,
  deleteReadNotifications,
  deleteNotification,
  setSocketService,
};
