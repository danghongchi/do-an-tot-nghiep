const { query } = require('../config/database');
const { sendCounselorApplicationEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const path = require('path');

// Get all counselors
const getCounselors = async (req, res) => {
  try {
    const sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.date_of_birth,
             cp.specialty_id, cp.clinic_address, cp.experience_years, cp.experience_description, 
             cp.online_price, cp.offline_price, cp.working_hours, cp.is_available, cp.avatar_url,
             s.name as specialty_name,
             AVG(r.rating) as average_rating,
             COUNT(r.rating) as review_count,
             COALESCE(su.served_users, 0) AS served_users
      FROM users u
      LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      LEFT JOIN reviews r ON cp.id = r.counselor_id
      LEFT JOIN (
        SELECT counselor_id, COUNT(DISTINCT patient_id) AS served_users
        FROM appointments
        WHERE status IN ('confirmed','in_progress','completed')
        GROUP BY counselor_id
      ) su ON su.counselor_id = cp.id
      WHERE u.role = 'counselor' AND cp.id IS NOT NULL
      GROUP BY u.id, u.full_name, u.email, u.phone, u.gender, u.date_of_birth,
               cp.specialty_id, cp.clinic_address, cp.experience_years, cp.experience_description,
               cp.online_price, cp.offline_price, cp.working_hours, cp.is_available, cp.avatar_url,
               s.name, su.served_users
    `;
    
    const counselors = await query(sql);
    res.json(counselors);
  } catch (error) {
    console.error('Lỗi getCounselors:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get counselor by ID
const getCounselorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.date_of_birth,
             cp.specialty_id, cp.clinic_address, cp.experience_years, cp.experience_description, 
             cp.online_price, cp.offline_price, cp.working_hours, cp.is_available, cp.avatar_url,
             s.name as specialty_name,
             AVG(r.rating) as average_rating,
             COUNT(r.rating) as review_count,
             COALESCE(su.served_users, 0) AS served_users
      FROM users u
      LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      LEFT JOIN reviews r ON cp.id = r.counselor_id
      LEFT JOIN (
        SELECT counselor_id, COUNT(DISTINCT patient_id) AS served_users
        FROM appointments
        WHERE status IN ('confirmed','in_progress','completed')
        GROUP BY counselor_id
      ) su ON su.counselor_id = cp.id
      WHERE u.id = ? AND u.role = 'counselor'
      GROUP BY u.id, u.full_name, u.email, u.phone, u.gender, u.date_of_birth,
               cp.specialty_id, cp.clinic_address, cp.experience_years, cp.experience_description,
               cp.online_price, cp.offline_price, cp.working_hours, cp.is_available, cp.avatar_url,
               s.name, su.served_users
    `;
    
    const counselors = await query(sql, [id]);
    
    if (counselors.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor' });
    }
    
    res.json(counselors[0]);
  } catch (error) {
    console.error('Lỗi getCounselorById:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get counselor by user ID
const getCounselorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.date_of_birth,
             cp.specialty_id, cp.clinic_address, cp.experience_years, cp.experience_description, 
             cp.online_price, cp.offline_price, cp.working_hours, cp.is_available, cp.avatar_url,
             s.name as specialty_name
      FROM users u
      LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      WHERE u.id = ? AND u.role = 'counselor'
    `;
    
    const counselors = await query(sql, [userId]);
    
    if (counselors.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor' });
    }
    
    res.json(counselors[0]);
  } catch (error) {
    console.error('Lỗi getCounselorByUserId:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Update counselor profile
const updateCounselorProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      full_name, email, phone, gender, date_of_birth,
      specialty_id, clinic_address, experience_years, experience_description, 
      online_price, offline_price, working_hours, is_available, avatar_url 
    } = req.body;

    console.log('updateCounselorProfile - userId:', userId);
    console.log('updateCounselorProfile - body:', req.body);

    // Cập nhật thông tin cơ bản trong bảng users
    if (full_name || email || phone || gender || date_of_birth) {
      const updateFields = [];
      const updateValues = [];
      
      if (full_name) { updateFields.push('full_name = ?'); updateValues.push(full_name); }
      if (email) { updateFields.push('email = ?'); updateValues.push(email); }
      if (phone) { updateFields.push('phone = ?'); updateValues.push(phone); }
      if (gender) { updateFields.push('gender = ?'); updateValues.push(gender); }
      if (date_of_birth) { updateFields.push('date_of_birth = ?'); updateValues.push(date_of_birth); }
      
      if (updateFields.length > 0) {
        updateValues.push(userId);
        await query(
          `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      }
    }

    // Kiểm tra counselor tồn tại
    const existingCounselor = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [userId]);
    
    if (existingCounselor.length === 0) {
      // Tạo counselor profile mới
      await query(
        'INSERT INTO counselor_profiles (user_id, specialty_id, clinic_address, experience_years, experience_description, online_price, offline_price, working_hours, is_available, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, specialty_id || 1, clinic_address || null, experience_years || null, experience_description || null, online_price || null, offline_price || null, working_hours || null, is_available !== undefined ? is_available : true, avatar_url || null]
      );
    } else {
      // Cập nhật counselor profile
      await query(
        'UPDATE counselor_profiles SET specialty_id = ?, clinic_address = ?, experience_years = ?, experience_description = ?, online_price = ?, offline_price = ?, working_hours = ?, is_available = ?, avatar_url = ? WHERE user_id = ?',
        [specialty_id || 1, clinic_address || null, experience_years || null, experience_description || null, online_price || null, offline_price || null, working_hours || null, is_available !== undefined ? is_available : true, avatar_url || null, userId]
      );
    }

    // Lấy profile đã cập nhật để trả về
    const updatedProfile = await query(`
      SELECT u.id, u.full_name, u.email, u.phone, u.gender, u.date_of_birth,
             cp.specialty_id, cp.clinic_address, cp.experience_years, cp.experience_description, 
             cp.online_price, cp.offline_price, cp.working_hours, cp.is_available, cp.avatar_url,
             s.name as specialty_name
      FROM users u
      LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      WHERE u.id = ? AND u.role = 'counselor'
    `, [userId]);

    res.json({ 
      message: 'Cập nhật profile counselor thành công',
      profile: updatedProfile[0] || null
    });
  } catch (error) {
    console.error('Lỗi updateCounselorProfile:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      sql: error.sql,
      errno: error.errno,
      code: error.code
    });
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Submit counselor application
const submitCounselorApplication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      specialty_id,
      experience_years,
      experience_description,
      clinic_address,
      online_price,
      offline_price,
      working_hours,
      payment_info
    } = req.body;

    // Kiểm tra dữ liệu bắt buộc
    if (!specialty_id || !experience_years || !experience_description) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
    }

    // Kiểm tra đã có application chưa
    const existingApp = await query(
      'SELECT id FROM counselor_applications WHERE user_id = ?',
      [userId]
    );

    if (existingApp.length > 0) {
      return res.status(400).json({ message: 'Bạn đã gửi đơn đăng ký rồi' });
    }

    // Xử lý file uploads (nếu có)
    const qualificationDocs = req.files?.qualification_documents ? 
      JSON.stringify(req.files.qualification_documents.map(f => f.filename)) : null;
    const identityDocs = req.files?.identity_documents ? 
      JSON.stringify(req.files.identity_documents.map(f => f.filename)) : null;
    const licenseDocs = req.files?.license_documents ? 
      JSON.stringify(req.files.license_documents.map(f => f.filename)) : null;

    // Tạo application
    const result = await query(
      `INSERT INTO counselor_applications 
       (user_id, specialty_id, experience_years, experience_description, clinic_address, 
        online_price, offline_price, working_hours, qualification_documents, 
        identity_documents, license_documents, payment_info, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', NOW())`,
      [userId, parseInt(specialty_id), parseInt(experience_years), experience_description, 
       clinic_address || null, online_price ? parseFloat(online_price) : null, 
       offline_price ? parseFloat(offline_price) : null, working_hours || null,
       qualificationDocs, identityDocs, licenseDocs, payment_info || null]
    );

    // Notify admins about new application (global admin channel)
    try {
      // Lấy tất cả admin ids
      const admins = await query('SELECT id FROM users WHERE role = "admin"');
      for (const admin of admins) {
        await createNotification({
          user_id: admin.id,
          title: 'Đơn đăng ký counselor mới',
          message: 'Có một đơn đăng ký counselor mới cần duyệt',
          type: 'admin',
          priority: 'high',
          data: { application_id: result.insertId }
        });
      }
    } catch (_) {}

    res.json({ 
      message: 'Nộp hồ sơ thành công',
      application_id: result.insertId 
    });
  } catch (error) {
    console.error('Lỗi submitCounselorApplication:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Get my application status
const getMyApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const applications = await query(
      'SELECT * FROM counselor_applications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    if (applications.length === 0) {
      return res.json({ message: 'Chưa có đơn đăng ký nào' });
    }

    res.json(applications[0]);
  } catch (error) {
    console.error('Lỗi getMyApplicationStatus:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get counselor schedule
const getCounselorSchedule = async (req, res) => {
  try {
    const { counselorId } = req.params;
    const { date, appointment_type } = req.query;

    // counselorId trên route là users.id → map sang counselor_profiles.id
    const rows = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [counselorId]);
    if (rows.length === 0) {
      return res.json([]);
    }
    const counselor_profile_id = rows[0].id;

    let sql = `
      SELECT 
        s.*, 
        TIME_FORMAT(s.start_time, '%H:%i') AS time,
        CASE 
          WHEN a.id IS NOT NULL THEN 'booked'
          ELSE 'available'
        END AS status
      FROM counselor_schedules s
      LEFT JOIN appointments a ON s.id = a.schedule_id AND a.status != 'cancelled'
      WHERE s.counselor_id = ?
    `;
    
    const params = [counselor_profile_id];

    if (date) {
      sql += ' AND DATE(s.date) = ?';
      params.push(date);
    }

    if (appointment_type) {
      sql += ' AND s.appointment_type = ?';
      params.push(appointment_type);
    }

    sql += ' ORDER BY s.date, s.start_time';

    const schedules = await query(sql, params);
    res.json(schedules);
  } catch (error) {
    console.error('Lỗi getCounselorSchedule:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getCounselors,
  getCounselorById,
  getCounselorByUserId,
  updateCounselorProfile,
  // upload avatar controller will be appended below
  submitCounselorApplication,
  getMyApplicationStatus,
  getCounselorSchedule
};

// Upload avatar file and save avatar_url
module.exports.uploadAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file tải lên' });
    }

    const relativeUrl = `/uploads/${req.file.filename}`;

    // Fetch old avatar to delete if exists
    const rows = await query('SELECT avatar_url FROM counselor_profiles WHERE user_id = ?', [userId]);
    const oldAvatar = rows.length > 0 ? rows[0].avatar_url : null;

    // Ensure counselor profile exists, then update avatar
    if (rows.length === 0) {
      await query(
        'INSERT INTO counselor_profiles (user_id, specialty_id, avatar_url, is_available) VALUES (?, ?, ?, 1)',
        [userId, 1, relativeUrl]
      );
    } else {
      await query('UPDATE counselor_profiles SET avatar_url = ? WHERE user_id = ?', [relativeUrl, userId]);
    }

    // Safely remove previous file (only files under Backend/uploads)
    try {
      if (oldAvatar && typeof oldAvatar === 'string' && oldAvatar.startsWith('/uploads/')) {
        const uploadsRoot = path.join(__dirname, '..', 'uploads');
        const filePath = path.join(uploadsRoot, oldAvatar.replace('/uploads/', ''));
        // Ensure filePath is inside uploadsRoot
        if (filePath.startsWith(uploadsRoot)) {
          const fs = require('fs');
          fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.warn('Không thể xóa ảnh cũ:', err.message);
            }
          });
        }
      }
    } catch (delErr) {
      console.warn('Lỗi khi xóa ảnh cũ:', delErr.message);
    }

    res.json({ message: 'Tải ảnh thành công', avatar_url: relativeUrl });
  } catch (error) {
    console.error('Lỗi uploadAvatar:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
