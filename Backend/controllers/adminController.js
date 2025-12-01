const { query } = require('../config/database');
const { sendCounselorApplicationEmail, sendEmailVerification, sendWelcomeEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Get specialties
const getSpecialties = async (req, res) => {
  try {
    const specialties = await query('SELECT id, name FROM specialties ORDER BY name');
    res.json(specialties);
  } catch (error) {
    console.error('Lỗi getSpecialties:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Create specialty
const createSpecialty = async (req, res) => {
  try {
    const { name } = req.body;
    
    const result = await query('INSERT INTO specialties (name) VALUES (?)', [name]);
    res.json({ message: 'Tạo chuyên khoa thành công', id: result.insertId });
  } catch (error) {
    console.error('Lỗi createSpecialty:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Update specialty
const updateSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    await query('UPDATE specialties SET name = ? WHERE id = ?', [name, id]);
    res.json({ message: 'Cập nhật chuyên khoa thành công' });
  } catch (error) {
    console.error('Lỗi updateSpecialty:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete specialty
const deleteSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM specialties WHERE id = ?', [id]);
    res.json({ message: 'Xóa chuyên khoa thành công' });
  } catch (error) {
    console.error('Lỗi deleteSpecialty:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get counselor applications
const getCounselorApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT ca.*, u.full_name, u.email, u.phone, s.name as specialty_name
      FROM counselor_applications ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN specialties s ON ca.specialty_id = s.id
    `;
    const params = [];
    if (status) {
      sql += ' WHERE ca.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY ca.created_at DESC';
    const applications = await query(sql, params);
    res.json(applications);
  } catch (error) {
    console.error('Lỗi getCounselorApplications:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get counselor application by ID
const getCounselorApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT ca.*, u.full_name, u.email, u.phone, u.gender, u.date_of_birth, s.name as specialty_name
      FROM counselor_applications ca
      JOIN users u ON ca.user_id = u.id
      LEFT JOIN specialties s ON ca.specialty_id = s.id
      WHERE ca.id = ?
    `;
    
    const applications = await query(sql, [id]);
    
    if (applications.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }
    
    res.json(applications[0]);
  } catch (error) {
    console.error('Lỗi getCounselorApplicationById:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Approve counselor application
const approveCounselorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Lấy thông tin application
    const applications = await query('SELECT * FROM counselor_applications WHERE id = ?', [id]);
    if (applications.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }
    
    const application = applications[0];
    
    // Cập nhật status application
    await query('UPDATE counselor_applications SET status = "approved" WHERE id = ?', [id]);
    
    // Cập nhật role user
    await query('UPDATE users SET role = "counselor" WHERE id = ?', [application.user_id]);
    
    // Tạo counselor profile
    await query(
      `INSERT INTO counselor_profiles (user_id, specialty_id, experience_years, experience_description, online_price, offline_price, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [application.user_id, application.specialty_id || 1, application.experience_years || 0, 
       application.experience_description || '', application.online_price || 0, application.offline_price || 0, 1]
    );
    
    // Gửi email + thông báo realtime cho counselor
    try {
      const users = await query('SELECT email FROM users WHERE id = ?', [application.user_id]);
      if (users.length > 0) {
        try {
          await sendCounselorApplicationEmail(users[0].email, 'approved');
          console.log(`Email thông báo đã được gửi cho user: ${users[0].email}`);
        } catch (emailError) {
          console.error('Lỗi gửi email:', emailError);
          // Tiếp tục xử lý dù email lỗi
        }
      }
      
      try {
        await createNotification({
          user_id: application.user_id,
          title: 'Hồ sơ counselor đã được duyệt',
          message: 'Chúc mừng! Hồ sơ counselor của bạn đã được duyệt.',
          type: 'admin',
          priority: 'high',
          data: { application_id: Number(id), status: 'approved' }
        });
      } catch (notificationError) {
        console.error('Lỗi tạo thông báo:', notificationError);
        // Tiếp tục xử lý dù thông báo lỗi
      }
    } catch (generalError) {
      console.error('Lỗi xử lý email/thông báo:', generalError);
      // Không fail việc approve nếu có lỗi phụ
    }
    
    res.json({ message: 'Duyệt đơn đăng ký counselor thành công' });
  } catch (error) {
    console.error('Lỗi approveCounselorApplication:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Reject counselor application
const rejectCounselorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    // Accept both 'reason' and 'rejection_reason' from client
    const reason = req.body?.rejection_reason ?? req.body?.reason;
    
    // Lấy thông tin application
    const applications = await query('SELECT * FROM counselor_applications WHERE id = ?', [id]);
    if (applications.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }
    
    const application = applications[0];
    
    // Cập nhật status application (không dùng rejection_reason vì có thể chưa có cột này)
    await query('UPDATE counselor_applications SET status = "rejected" WHERE id = ?', [id]);
    
    // Gửi email + thông báo realtime cho counselor
    try {
      const users = await query('SELECT email FROM users WHERE id = ?', [application.user_id]);
      if (users.length > 0) {
        try {
          await sendCounselorApplicationEmail(users[0].email, 'rejected');
          console.log(`Email thông báo đã được gửi cho user: ${users[0].email}`);
        } catch (emailError) {
          console.error('Lỗi gửi email:', emailError);
          // Tiếp tục xử lý dù email lỗi
        }
      }
      
      try {
        await createNotification({
          user_id: application.user_id,
          title: 'Hồ sơ counselor bị từ chối',
          message: 'Rất tiếc! Hồ sơ counselor của bạn đã bị từ chối.',
          type: 'admin',
          priority: 'normal',
          data: { application_id: Number(id), status: 'rejected' }
        });
      } catch (notificationError) {
        console.error('Lỗi tạo thông báo:', notificationError);
        // Tiếp tục xử lý dù thông báo lỗi
      }
    } catch (generalError) {
      console.error('Lỗi xử lý email/thông báo:', generalError);
      // Không fail việc reject nếu có lỗi phụ
    }
    
    res.json({ message: 'Từ chối đơn đăng ký counselor thành công' });
  } catch (error) {
    console.error('Lỗi rejectCounselorApplication:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete counselor application
const deleteCounselorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra application tồn tại
    const applications = await query('SELECT * FROM counselor_applications WHERE id = ?', [id]);
    if (applications.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đăng ký' });
    }

    // Xóa application
    await query('DELETE FROM counselor_applications WHERE id = ?', [id]);
    
    res.json({ message: 'Xóa đơn đăng ký thành công' });
  } catch (error) {
    console.error('Lỗi deleteCounselorApplication:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get admin stats
const getAdminStats = async (req, res) => {
  try {
    const stats = {};
    
    // Tổng số users
    const totalUsers = await query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
    stats.totalUsers = totalUsers[0].count;
    
    // Tổng số counselors
    const totalCounselors = await query('SELECT COUNT(*) as count FROM users WHERE role = "counselor"');
    stats.totalCounselors = totalCounselors[0].count;

    // Admins count
    try {
      const totalAdmins = await query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
      stats.totalAdmins = totalAdmins[0].count;
    } catch (e) {
      stats.totalAdmins = 0;
    }

    // Total accounts across all roles
    try {
      const totalAccounts = await query('SELECT COUNT(*) as count FROM users');
      stats.totalAccounts = totalAccounts[0].count;
    } catch (e) {
      stats.totalAccounts = (Number(stats.totalUsers)||0) + (Number(stats.totalCounselors)||0) + (Number(stats.totalAdmins)||0);
    }
    
    // Tổng số appointments
    const totalAppointments = await query('SELECT COUNT(*) as count FROM appointments');
    stats.totalAppointments = totalAppointments[0].count;
    
    // Tổng số counselor applications
    const totalApplications = await query('SELECT COUNT(*) as count FROM counselor_applications');
    stats.totalApplications = totalApplications[0].count;
    
    // Applications pending
    const pendingApplications = await query('SELECT COUNT(*) as count FROM counselor_applications WHERE status = "pending_review"');
    stats.pendingApplications = pendingApplications[0].count;
    
    // Email verification stats (tolerant if column missing)
    try {
      const unverifiedEmails = await query('SELECT COUNT(*) as count FROM users WHERE email_verified = 0');
      stats.unverifiedEmails = unverifiedEmails[0].count;
    } catch (e) {
      stats.unverifiedEmails = 0;
    }
    try {
      const verifiedEmails = await query('SELECT COUNT(*) as count FROM users WHERE email_verified = 1');
      stats.verifiedEmails = verifiedEmails[0].count;
    } catch (e) {
      stats.verifiedEmails = 0;
    }

    // Total anonymous chats
    try {
      const anonymousChats = await query('SELECT COUNT(DISTINCT session_id) as count FROM messages WHERE user_id IS NULL');
      stats.totalAnonymousChats = anonymousChats[0].count;
    } catch (e) {
      stats.totalAnonymousChats = 0;
    }

    // Total contacts
    try {
      const contacts = await query('SELECT COUNT(*) as count FROM contacts WHERE status = "pending"');
      stats.totalContacts = contacts[0].count;
    } catch (e) {
      stats.totalContacts = 0;
    }

    // Website visits - count from appointments and sessions as a proxy
    try {
      // Count unique users who have appointments (patient visits)
      const userVisitsResult = await query('SELECT COUNT(DISTINCT patient_id) as count FROM appointments');
      stats.userVisits = userVisitsResult[0].count;
      
      // Count unique counselors who have appointments (counselor visits)
      const counselorVisitsResult = await query('SELECT COUNT(DISTINCT counselor_id) as count FROM appointments');
      stats.counselorVisits = counselorVisitsResult[0].count;
      
      // Total visits = user visits + counselor visits + anonymous chats
      stats.totalVisits = (stats.userVisits || 0) + (stats.counselorVisits || 0) + (stats.totalAnonymousChats || 0);
    } catch (e) {
      console.error('Error calculating visits:', e);
      stats.totalVisits = 0;
      stats.userVisits = 0;
      stats.counselorVisits = 0;
    }

    // Active appointments (today or upcoming)
    try {
      const activeAppts = await query('SELECT COUNT(*) as count FROM appointments WHERE status IN ("confirmed", "in_progress") AND appointment_date >= CURDATE()');
      stats.activeAppointments = activeAppts[0].count;
    } catch (e) {
      stats.activeAppointments = 0;
    }

    // Pending reviews (mock - implement if you have reviews table)
    stats.pendingReviews = 0;

    // Today's registrations
    try {
      const todayRegs = await query('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()');
      stats.todayRegistrations = todayRegs[0].count;
    } catch (e) {
      stats.todayRegistrations = 0;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Lỗi getAdminStats:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await query('SELECT id, full_name, email, phone, gender, role, is_active, email_verified, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Lỗi getUsers:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { full_name, email, password, phone, gender, date_of_birth, role, is_active, email_verified, send_verification_email } = req.body;
    
    // Kiểm tra email đã tồn tại
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Xác định trạng thái email_verified
    let finalEmailVerified = false;
    if (email_verified === true || email_verified === 'true') {
      finalEmailVerified = true;
    }
    
    const result = await query(
      'INSERT INTO users (full_name, email, password, phone, gender, date_of_birth, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, phone, gender, date_of_birth, role, is_active !== undefined ? is_active : true, finalEmailVerified]
    );
    
    const userId = result.insertId;
    
    // Gửi email verification nếu được yêu cầu và email chưa được verify
    if (send_verification_email && !finalEmailVerified) {
      try {
        // Tạo verification token
        const verificationToken = jwt.sign(
          { userId: userId, email: email },
          config.jwtSecret,
          { expiresIn: '24h' }
        );
        
        // Gửi email verification
        await sendEmailVerification(email, full_name, verificationToken);
        console.log(`Email verification đã được gửi cho user mới: ${email}`);
      } catch (emailError) {
        console.error('Lỗi gửi email verification:', emailError);
        // Không fail việc tạo user nếu gửi email lỗi
      }
    }
    
    // Gửi welcome email nếu email đã được verify
    if (finalEmailVerified) {
      try {
        await sendWelcomeEmail(email, full_name);
        console.log(`Welcome email đã được gửi cho user mới: ${email}`);
      } catch (emailError) {
        console.error('Lỗi gửi welcome email:', emailError);
        // Không fail việc tạo user nếu gửi email lỗi
      }
    }
    
    res.json({ 
      message: 'Tạo user thành công', 
      id: userId,
      email_verified: finalEmailVerified,
      email_sent: send_verification_email && !finalEmailVerified
    });
  } catch (error) {
    console.error('Lỗi createUser:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, gender, date_of_birth, role, is_active, email_verified, password } = req.body;
    
    // Build dynamic query based on provided fields
    let updateFields = [];
    let updateValues = [];
    
    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (date_of_birth !== undefined) {
      updateFields.push('date_of_birth = ?');
      updateValues.push(date_of_birth);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }
    if (email_verified !== undefined) {
      updateFields.push('email_verified = ?');
      updateValues.push(email_verified ? 1 : 0);
    }
    if (password !== undefined && password.trim() !== '') {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push('password = ?');
      updateValues.push(hashedPassword);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Không có trường nào để cập nhật' });
    }
    
    updateValues.push(id);
    
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    res.json({ message: 'Cập nhật user thành công' });
  } catch (error) {
    console.error('Lỗi updateUser:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Toggle user active status
const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    await query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, id]);
    res.json({ message: 'Cập nhật trạng thái user thành công' });
  } catch (error) {
    console.error('Lỗi toggleUserActive:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Xóa user thành công' });
  } catch (error) {
    console.error('Lỗi deleteUser:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get all counselors for admin
const getCounselors = async (req, res) => {
  try {
    const sql = `
      SELECT 
        cp.id as counselor_id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        u.gender,
        cp.avatar_url,
        s.name as specialty_name,
        s.description as specialty_description,
        cp.experience_years,
        cp.experience_description,
        cp.clinic_address,
        cp.working_hours,
        cp.online_price,
        cp.offline_price,
        cp.is_available,
        u.is_active,
        u.created_at
      FROM counselor_profiles cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      WHERE u.role = 'counselor'
      ORDER BY u.created_at DESC
    `;
    
    const counselors = await query(sql);
    res.json(counselors);
  } catch (error) {
    console.error('Lỗi getCounselors:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Create counselor
const createCounselor = async (req, res) => {
  try {
    const { 
      full_name, 
      email, 
      phone, 
      specialty_id, 
      clinic_address, 
      experience_years, 
      experience_description, 
      online_price, 
      offline_price, 
      working_hours, 
      is_available 
    } = req.body;

    // Validate required fields
    if (!full_name || !email) {
      return res.status(400).json({ message: 'Tên và email là bắt buộc' });
    }

    // Check if email already exists
    const existingUser = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
    }

    // Create user first
    const userResult = await query(
      'INSERT INTO users (full_name, email, phone, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, phone || null, 'counselor', true, true]
    );

    const userId = userResult.insertId;

    // Create counselor profile
    await query(
      `INSERT INTO counselor_profiles 
       (user_id, specialty_id, experience_years, experience_description, clinic_address, 
        online_price, offline_price, working_hours, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, 
        specialty_id || 1, 
        parseInt(experience_years) || 0, 
        experience_description || '', 
        clinic_address || '',
        parseFloat(online_price) || 0, 
        parseFloat(offline_price) || 0, 
        working_hours || '',
        is_available !== false // default true
      ]
    );

    res.json({ message: 'Tạo chuyên gia thành công', user_id: userId });
  } catch (error) {
    console.error('Lỗi createCounselor:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Update counselor
const updateCounselor = async (req, res) => {
  try {
    const { id } = req.params; // This is counselor_id from frontend
    const updateData = req.body;

    // Get user_id from counselor_id
    const counselorQuery = await query('SELECT user_id FROM counselor_profiles WHERE id = ?', [id]);
    if (counselorQuery.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor' });
    }
    
    const userId = counselorQuery[0].user_id;

    // Update user table (basic info)
    const {
      full_name,
      email,
      phone,
      specialty_id,
      clinic_address,
      experience_years,
      experience_description,
      online_price,
      offline_price,
      working_hours,
      is_available
    } = updateData;

    // Update users table if basic info is provided
    if (full_name || email || phone) {
      const userUpdateFields = [];
      const userUpdateValues = [];
      
      if (full_name) {
        userUpdateFields.push('full_name = ?');
        userUpdateValues.push(full_name);
      }
      if (email) {
        userUpdateFields.push('email = ?');
        userUpdateValues.push(email);
      }
      if (phone) {
        userUpdateFields.push('phone = ?');
        userUpdateValues.push(phone);
      }
      
      if (userUpdateFields.length > 0) {
        userUpdateValues.push(userId);
        await query(
          `UPDATE users SET ${userUpdateFields.join(', ')} WHERE id = ?`,
          userUpdateValues
        );
      }
    }

    // Update counselor_profiles table
    const profileUpdateFields = [];
    const profileUpdateValues = [];
    
    if (specialty_id !== undefined) {
      profileUpdateFields.push('specialty_id = ?');
      profileUpdateValues.push(specialty_id || null);
    }
    if (clinic_address !== undefined) {
      profileUpdateFields.push('clinic_address = ?');
      profileUpdateValues.push(clinic_address);
    }
    if (experience_years !== undefined) {
      profileUpdateFields.push('experience_years = ?');
      profileUpdateValues.push(experience_years);
    }
    if (experience_description !== undefined) {
      profileUpdateFields.push('experience_description = ?');
      profileUpdateValues.push(experience_description);
    }
    if (online_price !== undefined) {
      profileUpdateFields.push('online_price = ?');
      profileUpdateValues.push(online_price);
    }
    if (offline_price !== undefined) {
      profileUpdateFields.push('offline_price = ?');
      profileUpdateValues.push(offline_price);
    }
    if (working_hours !== undefined) {
      profileUpdateFields.push('working_hours = ?');
      profileUpdateValues.push(working_hours);
    }
    if (is_available !== undefined) {
      profileUpdateFields.push('is_available = ?');
      profileUpdateValues.push(is_available);
    }

    if (profileUpdateFields.length > 0) {
      profileUpdateValues.push(id);
      await query(
        `UPDATE counselor_profiles SET ${profileUpdateFields.join(', ')} WHERE id = ?`,
        profileUpdateValues
      );
    }

    res.json({ message: 'Cập nhật thông tin counselor thành công' });
  } catch (error) {
    console.error('Lỗi updateCounselor:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const path = require('path');
const fs = require('fs');

// Delete counselor and related data/files
const deleteCounselor = async (req, res) => {
  try {
    const { id } = req.params; // counselor_profile id

    // Fetch counselor profile to know user_id and avatar
    const profiles = await query('SELECT user_id, avatar_url FROM counselor_profiles WHERE id = ?', [id]);
    if (profiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor' });
    }
    const profile = profiles[0];
    const userId = profile.user_id;

    // Remove counselor application documents (if any)
    try {
      const apps = await query(
        'SELECT qualification_documents, identity_documents, license_documents FROM counselor_applications WHERE user_id = ?',
        [userId]
      );
      const uploadsRoot = path.join(__dirname, '..', 'uploads');
      const safeUnlink = (filename) => {
        if (!filename) return;
        const filePath = path.join(uploadsRoot, filename);
        if (!filePath.startsWith(uploadsRoot)) return; // path traversal guard
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.warn('Không thể xóa file:', filename, err.message);
          }
        });
      };

      for (const app of apps) {
        const fields = ['qualification_documents', 'identity_documents', 'license_documents'];
        for (const f of fields) {
          if (app[f]) {
            try {
              const list = JSON.parse(app[f]);
              if (Array.isArray(list)) {
                list.forEach(safeUnlink);
              }
            } catch (_) {
              // ignore JSON parse errors
            }
          }
        }
      }

      // Delete application rows
      await query('DELETE FROM counselor_applications WHERE user_id = ?', [userId]);
    } catch (docErr) {
      console.warn('Lỗi xóa tài liệu xác minh:', docErr.message);
    }

    // Delete avatar file if present
    try {
      if (profile && profile.avatar_url && typeof profile.avatar_url === 'string' && profile.avatar_url.startsWith('/uploads/')) {
        const uploadsRoot = path.join(__dirname, '..', 'uploads');
        const filename = profile.avatar_url.replace('/uploads/', '');
        const filePath = path.join(uploadsRoot, filename);
        if (filePath.startsWith(uploadsRoot)) {
          fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
              console.warn('Không thể xóa avatar:', err.message);
            }
          });
        }
      }
    } catch (avatarErr) {
      console.warn('Lỗi xóa avatar:', avatarErr.message);
    }

    // Clean dependent data to satisfy FKs
    // Delete messages and reviews tied to appointments of this counselor
    const appts = await query('SELECT id FROM appointments WHERE counselor_id = ?', [id]);
      const appointmentIds = appts.map(a => a.id);
      if (appointmentIds.length > 0) {
        const placeholders = appointmentIds.map(() => '?').join(',');
        await query(`DELETE FROM messages WHERE appointment_id IN (${placeholders})`, appointmentIds);
        await query(`DELETE FROM reviews WHERE appointment_id IN (${placeholders})`, appointmentIds);
        await query(`DELETE FROM appointments WHERE id IN (${placeholders})`, appointmentIds);
      }

      // Delete schedules of this counselor
      await query('DELETE FROM counselor_schedules WHERE counselor_id = ?', [id]);

    // Finally delete counselor profile
    await query('DELETE FROM counselor_profiles WHERE id = ?', [id]);

    // Update user role back to 'user'
    await query('UPDATE users SET role = "user" WHERE id = ?', [userId]);

    res.json({ message: 'Xóa counselor và dữ liệu liên quan thành công' });
  } catch (error) {
    console.error('Lỗi deleteCounselor:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get all anonymous chats for admin - DISABLED (table removed)
/* 
const getAnonymousChats = async (req, res) => {
  try {
    const sql = `
      SELECT 
        ac.id,
        ac.anonymous_name,
        ac.category,
        ac.description,
        ac.priority,
        ac.status,
        ac.created_at,
        ac.assigned_at,
        ac.completed_at,
        u.full_name as patient_name,
        u.email as patient_email,
        c.full_name as counselor_name,
        c.email as counselor_email
      FROM anonymous_chats ac
      LEFT JOIN users u ON ac.patient_id = u.id
      LEFT JOIN users c ON ac.counselor_id = c.id
      ORDER BY ac.created_at DESC
    `;
    
    const chats = await query(sql);
    res.json(chats);
  } catch (error) {
    console.error('Lỗi getAnonymousChats:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
*/

// CHAT MANAGEMENT FUNCTIONS - Using messages table
// Get all chat sessions for admin
const getChats = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT
        a.id as appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status as appointment_status,
        a.appointment_type,
        a.is_anonymous,
        u.full_name as patient_name,
        u.email as patient_email,
        cp.user_id as counselor_user_id,
        cu.full_name as counselor_name,
        cu.email as counselor_email,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at,
        SUM(CASE WHEN m.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      LEFT JOIN counselor_profiles cp ON a.counselor_id = cp.id
      LEFT JOIN users cu ON cp.user_id = cu.id
      LEFT JOIN messages m ON a.id = m.appointment_id
      WHERE a.status IN ('confirmed', 'in_progress', 'completed')
      GROUP BY a.id
      HAVING message_count > 0
      ORDER BY last_message_at DESC
    `;
    
    const chats = await query(sql);
    res.json(chats);
  } catch (error) {
    console.error('Lỗi getChats:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get chat by appointment ID
const getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        a.*,
        u.full_name as patient_name,
        u.email as patient_email,
        cp.user_id as counselor_user_id,
        cu.full_name as counselor_name,
        cu.email as counselor_email
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      LEFT JOIN counselor_profiles cp ON a.counselor_id = cp.id
      LEFT JOIN users cu ON cp.user_id = cu.id
      WHERE a.id = ?
    `;
    
    const chats = await query(sql, [id]);
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }
    
    res.json(chats[0]);
  } catch (error) {
    console.error('Lỗi getChatById:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get messages by appointment ID
const getChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        m.*,
        u.full_name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.appointment_id = ?
      ORDER BY m.created_at ASC
    `;
    
    const messages = await query(sql, [id]);
    res.json(messages);
  } catch (error) {
    console.error('Lỗi getChatMessages:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete chat (all messages for an appointment)
const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra appointment tồn tại
    const appointments = await query('SELECT * FROM appointments WHERE id = ?', [id]);
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }
    
    // Xóa tất cả tin nhắn của appointment này
    await query('DELETE FROM messages WHERE appointment_id = ?', [id]);
    
    res.json({ message: 'Xóa cuộc trò chuyện thành công' });
  } catch (error) {
    console.error('Lỗi deleteChat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

/*
// LEGACY ANONYMOUS CHAT FUNCTIONS - DISABLED (table removed)
// Get anonymous chat by ID
const getAnonymousChatById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        ac.*,
        u.full_name as patient_name,
        u.email as patient_email,
        c.full_name as counselor_name,
        c.email as counselor_email
      FROM anonymous_chats ac
      LEFT JOIN users u ON ac.patient_id = u.id
      LEFT JOIN users c ON ac.counselor_id = c.id
      WHERE ac.id = ?
    `;
    
    const chats = await query(sql, [id]);
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chat' });
    }
    
    res.json(chats[0]);
  } catch (error) {
    console.error('Lỗi getAnonymousChatById:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get anonymous chat messages
const getAnonymousChatMessages = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        am.*,
        u.full_name as sender_name
      FROM anonymous_messages am
      LEFT JOIN users u ON am.sender_id = u.id
      WHERE am.chat_id = ?
      ORDER BY am.created_at ASC
    `;
    
    const messages = await query(sql, [id]);
    res.json(messages);
  } catch (error) {
    console.error('Lỗi getAnonymousChatMessages:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Approve anonymous chat
const approveAnonymousChat = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra chat tồn tại
    const chats = await query('SELECT * FROM anonymous_chats WHERE id = ?', [id]);
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chat' });
    }
    
    const chat = chats[0];
    if (chat.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Chat không ở trạng thái chờ duyệt' });
    }
    
    // Cập nhật trạng thái
    await query(
      'UPDATE anonymous_chats SET status = "approved" WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Duyệt chat thành công' });
  } catch (error) {
    console.error('Lỗi approveAnonymousChat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Reject anonymous chat
const rejectAnonymousChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Kiểm tra chat tồn tại
    const chats = await query('SELECT * FROM anonymous_chats WHERE id = ?', [id]);
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chat' });
    }
    
    const chat = chats[0];
    if (chat.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Chat không ở trạng thái chờ duyệt' });
    }
    
    // Cập nhật trạng thái
    await query(
      'UPDATE anonymous_chats SET status = "rejected" WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Từ chối chat thành công' });
  } catch (error) {
    console.error('Lỗi rejectAnonymousChat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Assign counselor to chat
const assignCounselorToChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { counselor_id } = req.body;
    
    // Kiểm tra chat tồn tại
    const chats = await query('SELECT * FROM anonymous_chats WHERE id = ?', [id]);
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chat' });
    }
    
    // Kiểm tra counselor tồn tại
    const counselors = await query('SELECT * FROM users WHERE id = ? AND role = "counselor"', [counselor_id]);
    if (counselors.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor' });
    }
    
    // Cập nhật counselor cho chat
    await query(
      'UPDATE anonymous_chats SET counselor_id = ?, status = "assigned", assigned_at = NOW() WHERE id = ?',
      [counselor_id, id]
    );
    
    res.json({ message: 'Phân công counselor thành công' });
  } catch (error) {
    console.error('Lỗi assignCounselorToChat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete anonymous chat
const deleteAnonymousChat = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra chat tồn tại
    const chats = await query('SELECT * FROM anonymous_chats WHERE id = ?', [id]);
    if (chats.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy chat' });
    }
    
    // Xóa tin nhắn trước
    await query('DELETE FROM anonymous_messages WHERE chat_id = ?', [id]);
    
    // Xóa chat
    await query('DELETE FROM anonymous_chats WHERE id = ?', [id]);
    
    res.json({ message: 'Xóa chat thành công' });
  } catch (error) {
    console.error('Lỗi deleteAnonymousChat:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
*/

// Get appointments with messages
const getAppointmentsWithMessages = async (req, res) => {
  try {
    const sql = `
      SELECT a.id, a.appointment_type, a.status, a.appointment_date, a.appointment_time,
             (a.notes LIKE '[ANON=1]%') AS is_anonymous,
             u1.full_name AS patient_name,
             u2.full_name AS counselor_name,
             s.name AS specialty_name,
             (SELECT COUNT(*) FROM messages m WHERE m.appointment_id = a.id) AS messages_count,
             (SELECT MAX(m.created_at) FROM messages m WHERE m.appointment_id = a.id) AS last_message_time
      FROM appointments a
      JOIN counselor_profiles cp ON a.counselor_id = cp.id
      LEFT JOIN specialties s ON cp.specialty_id = s.id
      LEFT JOIN users u1 ON a.patient_id = u1.id
      LEFT JOIN users u2 ON cp.user_id = u2.id
      ORDER BY a.created_at DESC
    `;

    const appointments = await query(sql);
    res.json(appointments);
  } catch (error) {
    console.error('Lỗi getAppointmentsWithMessages:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get appointment messages
const getAppointmentMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    
    // Kiểm tra appointment tồn tại
    const appointments = await query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy appointment' });
    }
    
    const isAnonymous = String(appointments[0].notes || '').startsWith('[ANON=1]');
    const messages = await query(
      `SELECT m.*, 
              CASE 
                WHEN ? AND m.sender_id = a.patient_id THEN CONCAT('Khách Ẩn danh #', LPAD(a.patient_id, 4, '0'))
                ELSE u.full_name
              END AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN appointments a ON a.id = m.appointment_id
       WHERE m.appointment_id = ?
       ORDER BY m.created_at ASC`,
      [isAnonymous, appointmentId]
    );

    res.json({ appointment: appointments[0], messages });
  } catch (error) {
    console.error('Lỗi getAppointmentMessages:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Safer delete for users: cleans related data to avoid FK errors
const deleteUserSafe = async (req, res) => {
  try {
    const { id } = req.params;

    // Check exists
    const rows = await query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Messages sent by user
    await query('DELETE FROM messages WHERE sender_id = ?', [id]);

    // Appointments where user is patient
    const pAppts = await query('SELECT id FROM appointments WHERE patient_id = ?', [id]);
    if (pAppts.length > 0) {
      const ids = pAppts.map(a => a.id);
      const ph = ids.map(() => '?').join(',');
      await query(`DELETE FROM messages WHERE appointment_id IN (${ph})`, ids);
      await query(`DELETE FROM reviews WHERE appointment_id IN (${ph})`, ids);
      await query(`DELETE FROM appointments WHERE id IN (${ph})`, ids);
    }

    // Reviews written by user
    await query('DELETE FROM reviews WHERE patient_id = ?', [id]);

    // Counselor-related cleanup if applicable
    const profs = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [id]);
    if (profs.length > 0) {
      const cpid = profs[0].id;
      const cAppts = await query('SELECT id FROM appointments WHERE counselor_id = ?', [cpid]);
      if (cAppts.length > 0) {
        const cids = cAppts.map(a => a.id);
        const cph = cids.map(() => '?').join(',');
        await query(`DELETE FROM messages WHERE appointment_id IN (${cph})`, cids);
        await query(`DELETE FROM reviews WHERE appointment_id IN (${cph})`, cids);
        await query(`DELETE FROM appointments WHERE id IN (${cph})`, cids);
      }
      await query('DELETE FROM counselor_schedules WHERE counselor_id = ?', [cpid]);
      await query('DELETE FROM counselor_applications WHERE user_id = ?', [id]);
      await query('DELETE FROM counselor_profiles WHERE user_id = ?', [id]);
    }

    // Anonymous chats (best-effort)
    try {
      await query('DELETE FROM anonymous_chats WHERE patient_id = ? OR counselor_id = ?', [id, id]);
    } catch (_) {}

    // Finally delete the user
    await query('DELETE FROM users WHERE id = ?', [id]);

    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUserSafe error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Safer create user: normalize optional fields and validate inputs
const createUserSafe = async (req, res) => {
  try {
    const { full_name, email, password, phone, gender, date_of_birth, role, is_active, email_verified, send_verification_email, send_welcome_email } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }

    // Check duplication
    const exist = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const normalizedPhone = phone && String(phone).trim() !== '' ? phone : null;
    const normalizedGender = gender && String(gender).trim() !== '' ? gender : null; // enum or NULL
    const normalizedDob = date_of_birth && String(date_of_birth).trim() !== '' ? date_of_birth : null;
    const finalRole = role || 'user';
    const finalActive = is_active !== undefined ? is_active : true;

    let finalEmailVerified = false;
    if (email_verified === true || email_verified === 'true') finalEmailVerified = true;

    const result = await query(
      'INSERT INTO users (full_name, email, password, phone, gender, date_of_birth, role, is_active, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [full_name || '', email, hashedPassword, normalizedPhone, normalizedGender, normalizedDob, finalRole, finalActive, finalEmailVerified]
    );

    const userId = result.insertId;

    // Send verification email if requested and email not already verified
    if (send_verification_email && !finalEmailVerified) {
      try {
        const jwt = require('jsonwebtoken');
        const config = require('../config');
        const { sendEmailVerification } = require('../services/emailService');
        const token = jwt.sign({ userId, email }, config.jwtSecret, { expiresIn: '24h' });
        await sendEmailVerification(email, full_name || '', token);
        console.log(`Verification email sent to: ${email}`);
      } catch (e) {
        console.warn('send verification email error (ignored):', e?.message || e);
      }
    }

    // Send welcome email if explicitly requested
    if (send_welcome_email === true || send_welcome_email === 'true') {
      try {
        const { sendWelcomeEmail } = require('../services/emailService');
        await sendWelcomeEmail(email, full_name || '');
        console.log(`Welcome email sent to: ${email}`);
      } catch (e) {
        console.warn('send welcome email error (ignored):', e?.message || e);
      }
    }

    return res.json({ 
      message: 'Tạo user thành công', 
      id: userId, 
      email_verified: finalEmailVerified, 
      verification_email_sent: !!(send_verification_email && !finalEmailVerified),
      welcome_email_sent: !!(send_welcome_email === true || send_welcome_email === 'true')
    });
  } catch (error) {
    console.error('createUserSafe error:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getSpecialties,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
  getCounselorApplications,
  getCounselorApplicationById,
  approveCounselorApplication,
  rejectCounselorApplication,
  deleteCounselorApplication,
  getAdminStats,
  getUsers,
  createUser: createUserSafe,
  updateUser,
  toggleUserActive,
  deleteUser: deleteUserSafe,
  getCounselors,
  createCounselor,
  updateCounselor,
  deleteCounselor,
  // Chat management functions (using messages table)
  getChats,
  getChatById,
  getChatMessages,
  deleteChat,
  getAppointmentsWithMessages,
  getAppointmentMessages
};
