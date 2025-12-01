const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const config = require('../config');
const { sendResetPasswordEmail, sendEmailVerification, checkEmailRateLimit } = require('../services/emailService');

// Ensure password_reset_tokens table exists
async function ensureResetTokensTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (e) {
    console.error('Failed to ensure password_reset_tokens table:', e);
    throw e;
  }
}

// Register
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, gender, date_of_birth, role } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    // Kiểm tra rate limit cho email
    if (!checkEmailRateLimit(email)) {
      return res.status(429).json({ message: 'Quá nhiều yêu cầu gửi email. Vui lòng thử lại sau 15 phút.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo verification token
    const verificationToken = jwt.sign(
      { email, type: 'email_verification' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Tạo user với email_verified = 0
    const result = await query(
      'INSERT INTO users (full_name, email, password, phone, gender, date_of_birth, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, phone, gender, date_of_birth, role || 'user', 0]
    );

    // Gửi email xác thực
    try {
      await sendEmailVerification(email, full_name, verificationToken);
    } catch (emailError) {
      console.error('Lỗi gửi email:', emailError);
      // Không dừng registration nếu gửi email thất bại
    }

    const token = jwt.sign(
      { id: result.insertId, email, role: role || 'user' },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
      token,
      user: {
        id: result.insertId,
        full_name,
        email,
        role: role || 'user',
        email_verified: false
      }
    });
  } catch (error) {
    console.error('Lỗi register:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Tìm user
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = users[0];

    // Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: !!user.email_verified
      }
    });
  } catch (error) {
    console.error('Lỗi login:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    // Lấy thông tin user đầy đủ từ database
    const users = await query('SELECT id, full_name, email, phone, gender, date_of_birth, role, is_active, email_verified FROM users WHERE id = ?', [req.user.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }
    
    const user = users[0];
    
    res.json({ 
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        role: user.role,
        is_active: !!user.is_active,
        email_verified: !!user.email_verified
      }
    });
  } catch (error) {
    console.error('Lỗi getMe:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra user tồn tại
    const users = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    // Ensure table exists
    await ensureResetTokensTable();

    // Tạo reset token
    const resetToken = jwt.sign({ email }, config.jwtSecret, { expiresIn: '1h' });

    // Lưu token vào database (tương thích cả schema có user_id hoặc email)
    try {
      // Thử schema cũ: user_id, token, expires_at, used
      await query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR), 0)',
        [users[0].id, resetToken]
      );
    } catch (e) {
      if (e && e.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback: schema hiện tại dùng email
        await query(
          'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
          [email, resetToken]
        );
      } else {
        throw e;
      }
    }

    // Gửi email (không fail toàn bộ nếu email lỗi)
    try {
      await sendResetPasswordEmail(email, resetToken);
    } catch (mailErr) {
      console.error('Gửi email reset thất bại (sẽ vẫn trả về thành công):', mailErr.message);
    }

    res.json({ message: 'Email đặt lại mật khẩu đã được gửi' });
  } catch (error) {
    console.error('Lỗi forgot password:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    await ensureResetTokensTable();

    // Kiểm tra token trong database (hỗ trợ cột used nếu tồn tại)
    let tokens = await query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (tokens.length === 0) {
      // Thử với điều kiện used = 0 nếu cột này tồn tại
      try {
        tokens = await query(
          'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = 0',
          [token]
        );
      } catch (_) {}
    }

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    res.json({ message: 'Token hợp lệ' });
  } catch (error) {
    console.error('Lỗi verify reset token:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    await ensureResetTokensTable();

    // Kiểm tra token (hỗ trợ schema có used)
    let tokens = await query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (tokens.length === 0) {
      try {
        tokens = await query(
          'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = 0',
          [token]
        );
      } catch (_) {}
    }

    if (tokens.length === 0) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const row = tokens[0];

    // Hash password mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật password theo user_id nếu có, ngược lại theo email
    if (row.user_id) {
      await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, row.user_id]);
    } else {
      await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, row.email]);
    }

    // Đánh dấu/ Xóa token đã sử dụng (tương thích cả hai schema)
    try {
      await query('UPDATE password_reset_tokens SET used = 1 WHERE token = ?', [token]);
    } catch (_) {
      await query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
    }

    res.json({ message: 'Mật khẩu đã được đặt lại thành công' });
  } catch (error) {
    console.error('Lỗi reset password:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    if (decoded.type !== 'email_verification') {
      return res.status(400).json({ message: 'Token không hợp lệ' });
    }

    const { email } = decoded;

    // Kiểm tra user tồn tại
    const users = await query('SELECT id, email_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = users[0];

    // Kiểm tra đã xác thực chưa
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email đã được xác thực trước đó' });
    }

    // Cập nhật trạng thái xác thực
    await query('UPDATE users SET email_verified = 1 WHERE email = ?', [email]);

    res.json({ message: 'Email đã được xác thực thành công' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Token đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Token không hợp lệ' });
    }
    
    console.error('Lỗi verify email:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Resend verification email
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra user tồn tại
    const users = await query('SELECT id, full_name, email_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Email không tồn tại' });
    }

    const user = users[0];

    // Kiểm tra đã xác thực chưa
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email đã được xác thực' });
    }

    // Kiểm tra rate limit
    if (!checkEmailRateLimit(email)) {
      return res.status(429).json({ message: 'Quá nhiều yêu cầu gửi email. Vui lòng thử lại sau 15 phút.' });
    }

    // Tạo verification token mới
    const verificationToken = jwt.sign(
      { email, type: 'email_verification' },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Gửi email xác thực
    await sendEmailVerification(email, user.full_name, verificationToken);

    res.json({ message: 'Email xác thực đã được gửi lại' });
  } catch (error) {
    console.error('Lỗi resend verification email:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu mật khẩu hiện tại hoặc mật khẩu mới' });
    }

    const users = await query('SELECT id, password FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    const user = users[0];
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashed, userId]);

    return res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('Lỗi change password:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// --- Social OAuth Login (Google / Facebook) ---
async function verifyGoogleIdToken(idToken){
  const https = require('https');
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  return new Promise((resolve, reject)=>{
    https.get(url, (resp)=>{
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', ()=>{
        try {
          const parsed = JSON.parse(data || '{}');
          if (parsed && parsed.email) return resolve(parsed);
          reject(new Error('Invalid Google token'));
        } catch(e){ reject(e); }
      });
    }).on('error', reject);
  });
}

// Facebook profile fetch removed (feature disabled)

const oauthLogin = async (req, res) => {
  try {
    const { provider, token } = req.body || {};
    if (!provider || !token) return res.status(400).json({ message: 'Thiếu provider hoặc token' });

    let email = null;
    let full_name = '';
    if (provider === 'google') {
      const info = await verifyGoogleIdToken(token);
      email = info.email;
      full_name = info.name || info.given_name || '';
    } else {
      return res.status(400).json({ message: 'Provider không hỗ trợ' });
    }

    if (!email) return res.status(400).json({ message: 'Không lấy được email từ nhà cung cấp' });

    // Find or create user
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    let user;
    if (users.length === 0) {
      const result = await query(
        'INSERT INTO users (full_name, email, role, email_verified) VALUES (?, ?, ?, ?)',
        [full_name || email.split('@')[0], email, 'user', 1]
      );
      user = { id: result.insertId, full_name: full_name || email.split('@')[0], email, role: 'user', email_verified: 1 };
    } else {
      user = users[0];
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
    res.json({
      message: 'Đăng nhập thành công',
      token: jwtToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: !!user.email_verified
      }
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    const msg = error?.message || 'Xác thực Google thất bại';
    res.status(400).json({ message: msg });
  }
};

module.exports = {
  register,
  login,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  changePassword,
  oauthLogin
};

