const { query } = require('../config/database');

async function ensureUserSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INT PRIMARY KEY,
      privacy_json TEXT NULL,
      notification_json TEXT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

// PUT /api/user/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, gender, date_of_birth } = req.body || {};

    const fields = [];
    const params = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); params.push(full_name); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (gender !== undefined) { fields.push('gender = ?'); params.push(gender); }
    if (date_of_birth !== undefined) { fields.push('date_of_birth = ?'); params.push(date_of_birth); }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'Không có trường nào để cập nhật' });
    }

    params.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, params);

    const [row] = await query('SELECT id, full_name, email, phone, gender, date_of_birth, role, is_active, email_verified FROM users WHERE id = ?', [userId]);
    return res.json({ message: 'Cập nhật hồ sơ thành công', user: row });
  } catch (e) {
    console.error('updateProfile error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PUT /api/user/settings
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { privacy, notifications } = req.body || {};

    await ensureUserSettingsTable();

    const privacyJson = privacy ? JSON.stringify(privacy) : null;
    const notifJson = notifications ? JSON.stringify(notifications) : null;

    // Upsert
    await query(
      `INSERT INTO user_settings (user_id, privacy_json, notification_json, updated_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE privacy_json = VALUES(privacy_json), notification_json = VALUES(notification_json), updated_at = NOW()`,
      [userId, privacyJson, notifJson]
    );

    const [row] = await query('SELECT privacy_json, notification_json, updated_at FROM user_settings WHERE user_id = ?', [userId]);
    return res.json({
      message: 'Lưu cài đặt thành công',
      settings: {
        privacy: row?.privacy_json ? JSON.parse(row.privacy_json) : null,
        notifications: row?.notification_json ? JSON.parse(row.notification_json) : null,
        updated_at: row?.updated_at || null
      }
    });
  } catch (e) {
    console.error('updateSettings error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};


