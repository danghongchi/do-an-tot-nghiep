const { query } = require('../config/database');
const { createNotification } = require('../services/notificationService');
const { emitAppointmentUpdate } = require('../services/realtimeService');

// ================= CLEANUP EXPIRED APPOINTMENTS =================
const cleanupExpiredPaymentPendingAppointments = async () => {
  try {
    // Xóa appointments chờ thanh toán quá 15 phút
    const result = await query(
      "DELETE FROM appointments WHERE status = 'payment_pending' AND created_at < DATE_SUB(NOW(), INTERVAL 15 MINUTE)"
    );
    if (result.affectedRows > 0) {
      console.log(`Cleaned up ${result.affectedRows} expired payment_pending appointments`);
    }
  } catch (error) {
    console.error('Error cleaning up expired appointments:', error);
  }
};

// Chạy cleanup mỗi 5 phút
setInterval(cleanupExpiredPaymentPendingAppointments, 5 * 60 * 1000);

// ================= BOOK APPOINTMENT =================
const bookAppointment = async (req, res) => {
  try {
    const { counselor_id, appointment_type, appointment_date, appointment_time, notes, is_anonymous } = req.body;
    const patient_id = req.user.id;

    console.log('[bookAppointment] Request data:', { counselor_id, appointment_type, appointment_date, appointment_time, patient_id });
    console.log('[bookAppointment] appointment_date type:', typeof appointment_date, 'value:', appointment_date);

    if (!counselor_id || !appointment_type || !appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt lịch' });
    }

    // counselor_id từ frontend là user.id → cần map sang counselor_profiles.id
    const counselorProfiles = await query(
      'SELECT id FROM counselor_profiles WHERE user_id = ?',
      [counselor_id]
    );
    if (counselorProfiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor' });
    }
    const counselor_profile_id = counselorProfiles[0].id;

    // Kiểm tra slot đã được đặt (bao gồm cả appointments chờ thanh toán)
    const existingAppointment = await query(
      "SELECT id FROM appointments WHERE counselor_id = ? AND appointment_date = ? AND appointment_time = ? AND status IN ('payment_pending','pending','confirmed','in_progress')",
      [counselor_profile_id, appointment_date, appointment_time]
    );
    if (existingAppointment.length > 0) {
      return res.status(400).json({ message: 'Thời gian này đã được đặt' });
    }

    // Tìm schedule_id hoặc tạo mới
    let schedule_id = null;
    const schedules = await query(
      'SELECT id FROM counselor_schedules WHERE counselor_id = ? AND date = ? AND appointment_type = ? AND start_time <= ? AND end_time >= ? AND is_available = 1',
      [counselor_profile_id, appointment_date, appointment_type, appointment_time, appointment_time]
    );
    if (schedules.length > 0) {
      schedule_id = schedules[0].id;
    } else {
      const created = await query(
        'INSERT INTO counselor_schedules (counselor_id, date, start_time, end_time, is_available, appointment_type, created_at) VALUES (?, ?, ?, ?, 1, ?, NOW())',
        [counselor_profile_id, appointment_date, appointment_time, appointment_time, appointment_type]
      );
      schedule_id = created.insertId;
    }

    // Tạo appointment với status chờ thanh toán
    console.log('[bookAppointment] Inserting appointment with date:', appointment_date);
    const result = await query(
      'INSERT INTO appointments (patient_id, counselor_id, schedule_id, appointment_type, appointment_date, appointment_time, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, "payment_pending", NOW())',
      [
        patient_id,
        counselor_profile_id,
        schedule_id,
        appointment_type,
        appointment_date,
        appointment_time,
        (is_anonymous ? '[ANON=1] ' : '') + (notes || '')
      ]
    );
    console.log('[bookAppointment] Created appointment ID:', result.insertId);
    
    // Verify what was actually saved
    const savedAppointment = await query('SELECT appointment_date, appointment_time FROM appointments WHERE id = ?', [result.insertId]);
    console.log('[bookAppointment] Saved appointment data:', savedAppointment[0]);

    // Nếu có cột is_anonymous thì update
    try {
      await query('UPDATE appointments SET is_anonymous = ? WHERE id = ?', [is_anonymous ? 1 : 0, result.insertId]);
    } catch (_) {}

    // Chỉ thông báo cho patient về việc cần thanh toán, không thông báo cho counselor
    await createNotification({
      user_id: patient_id,
      title: 'Vui lòng thanh toán',
      message: 'Lịch hẹn đã được tạo, vui lòng hoàn tất thanh toán để xác nhận',
      type: 'payment',
      priority: 'high',
      data: { appointment_id: result.insertId, date: appointment_date, time: appointment_time }
    });

    res.json({
      message: 'Đặt lịch thành công',
      appointmentId: result.insertId,
      is_anonymous: !!is_anonymous
    });
  } catch (error) {
    console.error('Lỗi bookAppointment:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ================= GET PATIENT APPOINTMENTS =================
const getPatientAppointments = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const sql = `
      SELECT a.*, 
             (COALESCE(a.is_anonymous, (a.notes LIKE '[ANON=1]%'))) AS is_anonymous,
             u.id as counselor_user_id,
             u.full_name as counselor_name, u.email as counselor_email, u.phone as counselor_phone,
             CASE 
               WHEN a.status = 'payment_pending' THEN 'Chờ thanh toán'
               ELSE a.status
             END as display_status
      FROM appointments a
      JOIN counselor_profiles cp ON a.counselor_id = cp.id
      JOIN users u ON cp.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const appointments = await query(sql, [patient_id]);
    // Mark whether each appointment has a review from this user
    try {
      const ids = appointments.map(a => a.id).filter(Boolean);
      if (ids.length) {
        const placeholders = ids.map(() => '?').join(',');
        const q = `SELECT appointment_id FROM reviews WHERE patient_id = ? AND appointment_id IN (${placeholders})`;
        const rows = await query(q, [patient_id, ...ids]);
        const reviewed = new Set(rows.map(r => Number(r.appointment_id)));
        for (const a of appointments) a.has_review = reviewed.has(Number(a.id)) ? 1 : 0;
      }
    } catch (_) {
      for (const a of appointments) if (a.has_review === undefined) a.has_review = 0;
    }
    res.json(appointments);
  } catch (error) {
    console.error('Lỗi getPatientAppointments:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ================= GET COUNSELOR APPOINTMENTS =================
const getCounselorAppointments = async (req, res) => {
  try {
    const [cp] = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [req.user.id]);
    if (!cp) return res.json([]);
    const counselor_id = cp.id;

    const sql = `
      SELECT a.*, 
             (COALESCE(a.is_anonymous, (a.notes LIKE '[ANON=1]%'))) AS is_anonymous,
             CASE 
               WHEN COALESCE(a.is_anonymous, (a.notes LIKE '[ANON=1]%')) 
               THEN CONCAT('Khách Ẩn danh #', LPAD(a.patient_id, 4, '0'))
               ELSE u.full_name
             END AS patient_name,
             u.email as patient_email, u.phone as patient_phone
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.counselor_id = ? AND a.status != 'payment_pending'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;
    const appointments = await query(sql, [counselor_id]);
    res.json(appointments);
  } catch (error) {
    console.error('Lỗi getCounselorAppointments:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ================= UPDATE APPOINTMENT STATUS =================
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;
    const user_role = req.user.role;

    const appointments = await query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (appointments.length === 0) return res.status(404).json({ message: 'Không tìm thấy appointment' });
    const appointment = appointments[0];

    // Kiểm tra quyền
    if (user_role === 'user' && appointment.patient_id !== user_id) {
      return res.status(403).json({ message: 'Không có quyền cập nhật appointment này' });
    }
    if (user_role === 'counselor') {
      const [cp] = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
      if (!cp || appointment.counselor_id !== cp.id) {
        return res.status(403).json({ message: 'Không có quyền cập nhật appointment này' });
      }
    }

    // Ràng buộc luồng trạng thái theo vai trò
    const allowedStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const current = String(appointment.status || 'pending');
    const flow = {
      user: {
        pending: ['cancelled'],
        confirmed: ['cancelled'],
        in_progress: [],
        completed: [],
        cancelled: []
      },
      counselor: {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['in_progress', 'cancelled'],
        in_progress: ['completed'],
        completed: [],
        cancelled: []
      },
      admin: {
        '*': allowedStatuses
      }
    };

    let can = false;
    if (user_role === 'admin') {
      can = true;
    } else if (flow[user_role] && flow[user_role][current]) {
      can = flow[user_role][current].includes(status);
    }
    if (!can) {
      return res.status(400).json({ message: 'Không được phép chuyển trạng thái ở bước này' });
    }

    await query('UPDATE appointments SET status = ? WHERE id = ?', [status, appointmentId]);
    emitAppointmentUpdate(appointmentId, { appointmentId: Number(appointmentId), status });

    // Notifications
    if (status === 'confirmed') {
      await createNotification({
        user_id: appointment.patient_id,
        title: 'Lịch hẹn đã được xác nhận',
        message: 'Chuyên gia đã xác nhận lịch hẹn của bạn',
        type: 'appointment',
        priority: 'high',
        data: { appointment_id: Number(appointmentId), status }
      });
    }

    if (status === 'cancelled') {
      const notifyUserId = user_role === 'counselor'
        ? appointment.patient_id
        : (await query('SELECT user_id FROM counselor_profiles WHERE id = ?', [appointment.counselor_id]))[0]?.user_id;
      if (notifyUserId) {
        await createNotification({
          user_id: notifyUserId,
          title: 'Lịch hẹn đã bị hủy',
          message: 'Một lịch hẹn đã được hủy',
          type: 'appointment',
          priority: 'normal',
          data: { appointment_id: Number(appointmentId), status }
        });
      }
    }

    if (status === 'in_progress') {
      await createNotification({
        user_id: appointment.patient_id,
        title: 'Buổi tư vấn bắt đầu',
        message: 'Chuyên gia đã bắt đầu buổi tư vấn của bạn.',
        type: 'appointment',
        priority: 'high',
        data: { appointment_id: Number(appointmentId), status }
      });
    }

    if (status === 'completed') {
      await createNotification({
        user_id: appointment.patient_id,
        title: 'Buổi tư vấn đã hoàn thành',
        message: 'Cảm ơn bạn! Hãy để lại đánh giá cho buổi tư vấn.',
        type: 'appointment',
        priority: 'normal',
        data: { appointment_id: Number(appointmentId), status }
      });
      const [cpUser] = await query('SELECT user_id FROM counselor_profiles WHERE id = ?', [appointment.counselor_id]);
      if (cpUser) {
        await createNotification({
          user_id: cpUser.user_id,
          title: 'Buổi tư vấn đã hoàn thành',
          message: 'Một buổi tư vấn của bạn đã hoàn thành.',
          type: 'appointment',
          priority: 'normal',
          data: { appointment_id: Number(appointmentId), status }
        });
      }
    }

    res.json({ message: 'Cập nhật trạng thái appointment thành công' });
  } catch (error) {
    console.error('Lỗi updateAppointmentStatus:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
// Get counselor schedules
const getCounselorSchedules = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Không có thông tin user' });
    }
    
    const user_id = req.user.id;
    const { start_date, end_date } = req.query;

    // Lấy counselor_profile_id từ user_id
    const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
    
    if (counselorProfiles.length === 0) {
      return res.json([]); // Trả về empty array thay vì 404
    }

    const counselor_profile_id = counselorProfiles[0].id;

    // Xây dựng query với filtering và JOIN với appointments
    let sql = `
      SELECT 
        cs.*,
        a.id as appointment_id,
        a.patient_id,
        a.status as appointment_status,
        a.notes as appointment_notes,
        a.is_anonymous,
        u.full_name as patient_name
      FROM counselor_schedules cs
      LEFT JOIN appointments a ON cs.id = a.schedule_id
      LEFT JOIN users u ON a.patient_id = u.id
      WHERE cs.counselor_id = ?
    `;
    const params = [counselor_profile_id];

    if (start_date) {
      sql += ' AND cs.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND cs.date <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY cs.date, cs.start_time';

    console.log('SQL Query:', sql);
    console.log('Params:', params);

    const results = await query(sql, params);
    
    // Group appointments by schedule
    const schedulesMap = new Map();
    
    results.forEach(row => {
      const scheduleId = row.id;
      
      if (!schedulesMap.has(scheduleId)) {
        schedulesMap.set(scheduleId, {
          id: row.id,
          counselor_id: row.counselor_id,
          date: row.date,
          start_time: row.start_time,
          end_time: row.end_time,
          is_available: row.is_available,
          appointment_type: row.appointment_type,
          created_at: row.created_at,
          updated_at: row.updated_at,
          appointments: []
        });
      }
      
      if (row.appointment_id) {
        const schedule = schedulesMap.get(scheduleId);
        schedule.appointments.push({
          id: row.appointment_id,
          patient_id: row.patient_id,
          status: row.appointment_status,
          notes: row.appointment_notes,
          is_anonymous: row.is_anonymous,
          patient_name: row.is_anonymous ? `Khách Ẩn danh #${String(row.patient_id).padStart(4, '0')}` : row.patient_name
        });
      }
    });
    
    const schedules = Array.from(schedulesMap.values());

    res.json(schedules);
  } catch (error) {
    console.error('Lỗi getCounselorSchedules:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Create counselor schedule
const createCounselorSchedule = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { date, start_time, end_time, appointment_type, is_available } = req.body;

    // Lấy counselor_profile_id từ user_id
    const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
    if (counselorProfiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor profile' });
    }

    const counselor_profile_id = counselorProfiles[0].id;

    // Kiểm tra conflict
    const conflicts = await query(
      'SELECT id FROM counselor_schedules WHERE counselor_id = ? AND date = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))',
      [counselor_profile_id, date, start_time, start_time, end_time, end_time]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Thời gian này đã có lịch' });
    }

    const result = await query(
      'INSERT INTO counselor_schedules (counselor_id, date, start_time, end_time, appointment_type, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [counselor_profile_id, date, start_time, end_time, appointment_type || 'online', is_available !== undefined ? is_available : true]
    );

    res.json({ message: 'Tạo lịch thành công', scheduleId: result.insertId });
  } catch (error) {
    console.error('Lỗi createCounselorSchedule:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Update counselor schedule
const updateCounselorSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const user_id = req.user.id;
    const { date, start_time, end_time, appointment_type, is_available } = req.body;
    
    console.log('updateCounselorSchedule called:', { scheduleId, user_id, body: req.body });

    // Lấy counselor_profile_id từ user_id
    const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
    if (counselorProfiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor profile' });
    }

    const counselor_profile_id = counselorProfiles[0].id;

    // Kiểm tra quyền
    const schedules = await query('SELECT * FROM counselor_schedules WHERE id = ? AND counselor_id = ?', [scheduleId, counselor_profile_id]);
    if (schedules.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hoặc không có quyền' });
    }

    // Nếu chỉ cập nhật is_available (toggle on/off)
    if (is_available !== undefined && !date && !start_time && !end_time) {
      console.log('Updating is_available only:', { scheduleId, is_available });
      await query('UPDATE counselor_schedules SET is_available = ? WHERE id = ?', [is_available, scheduleId]);
      console.log('Update successful');
      const response = { message: 'Cập nhật trạng thái lịch thành công' };
      console.log('Sending response:', response);
      res.json(response);
      return;
    }

    // Nếu cập nhật full thông tin lịch
    if (!date || !start_time || !end_time) {
      return res.status(400).json({ message: 'Thiếu thông tin date, start_time, end_time' });
    }

    // Kiểm tra conflict (trừ chính nó)
    const conflicts = await query(
      'SELECT id FROM counselor_schedules WHERE counselor_id = ? AND date = ? AND id != ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))',
      [counselor_profile_id, date, scheduleId, start_time, start_time, end_time, end_time]
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ message: 'Thời gian này đã có lịch khác' });
    }

    await query(
      'UPDATE counselor_schedules SET date = ?, start_time = ?, end_time = ?, appointment_type = ?, is_available = ? WHERE id = ?',
      [date, start_time, end_time, appointment_type || 'online', is_available, scheduleId]
    );

    res.json({ message: 'Cập nhật lịch thành công' });
  } catch (error) {
    console.error('Lỗi updateCounselorSchedule:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete counselor schedule
const deleteCounselorSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const user_id = req.user.id;

    // Lấy counselor_profile_id từ user_id
    const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
    if (counselorProfiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor profile' });
    }

    const counselor_profile_id = counselorProfiles[0].id;

    // Kiểm tra quyền
    const schedules = await query('SELECT * FROM counselor_schedules WHERE id = ? AND counselor_id = ?', [scheduleId, counselor_profile_id]);
    if (schedules.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hoặc không có quyền' });
    }

    // Kiểm tra có appointment nào đang sử dụng schedule này không
    const allAppointments = await query('SELECT id, status FROM appointments WHERE schedule_id = ?', [scheduleId]);
    
    if (allAppointments.length > 0) {
      // Kiểm tra các appointment chưa hoàn thành
      const activeAppointments = allAppointments.filter(a => !['cancelled', 'completed'].includes(a.status));
      
      if (activeAppointments.length > 0) {
        const statusList = activeAppointments.map(a => a.status).join(', ');
        return res.status(400).json({ 
          message: `Không thể xóa lịch này vì có ${activeAppointments.length} lịch hẹn chưa hoàn thành (${statusList}). Vui lòng hủy hoặc hoàn thành các lịch hẹn này trước, hoặc xóa các lịch hẹn này ở trang quản lý lịch hẹn.`
        });
      } else {
        // Tất cả appointment đã completed/cancelled, nhưng vẫn có constraint
        return res.status(400).json({ 
          message: `Không thể xóa lịch này vì có ${allAppointments.length} lịch hẹn đã hoàn thành liên kết. Vui lòng xóa các lịch hẹn này ở trang quản lý lịch hẹn trước khi xóa lịch làm việc.`
        });
      }
    }

    await query('DELETE FROM counselor_schedules WHERE id = ?', [scheduleId]);

    res.json({ message: 'Xóa lịch thành công' });
  } catch (error) {
    console.error('Lỗi deleteCounselorSchedule:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Bulk create counselor schedules
const bulkCreateCounselorSchedules = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { schedules } = req.body;

    // Lấy counselor_profile_id từ user_id
    const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
    if (counselorProfiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor profile' });
    }

    const counselor_profile_id = counselorProfiles[0].id;
    const results = [];
    
    for (const schedule of schedules) {
      const { date, start_time, end_time, appointment_type, is_available } = schedule;

      // Kiểm tra conflict
      const conflicts = await query(
        'SELECT id FROM counselor_schedules WHERE counselor_id = ? AND date = ? AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))',
        [counselor_profile_id, date, start_time, start_time, end_time, end_time]
      );

      if (conflicts.length === 0) {
        const result = await query(
          'INSERT INTO counselor_schedules (counselor_id, date, start_time, end_time, appointment_type, is_available, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
          [counselor_profile_id, date, start_time, end_time, appointment_type || 'online', is_available !== undefined ? is_available : true]
        );
        results.push({ success: true, scheduleId: result.insertId, date, start_time, end_time });
      } else {
        results.push({ success: false, error: 'Conflict', date, start_time, end_time });
      }
    }

    res.json({ message: 'Tạo lịch hàng loạt hoàn thành', results });
  } catch (error) {
    console.error('Lỗi bulkCreateCounselorSchedules:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Get appointment messages
const getAppointmentMessages = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const user_id = req.user.id;
    const user_role = req.user.role;

    // Kiểm tra quyền truy cập appointment
    const appointments = await query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy appointment' });
    }

    const appointment = appointments[0];
    if (user_role === 'user' && appointment.patient_id !== user_id) {
      return res.status(403).json({ message: 'Không có quyền truy cập appointment này' });
    }
    if (user_role === 'counselor') {
      const [cp] = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
      if (!cp || appointment.counselor_id !== cp.id) {
        return res.status(403).json({ message: 'Không có quyền truy cập appointment này' });
      }
    }

    const messages = await query(
      `SELECT m.*, 
              CASE 
                WHEN COALESCE(a.is_anonymous, (a.notes LIKE '[ANON=1]%')) AND m.sender_id = a.patient_id
                THEN CONCAT('Khách Ẩn danh #', LPAD(a.patient_id, 4, '0'))
                ELSE u.full_name
              END AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       JOIN appointments a ON a.id = m.appointment_id
       WHERE m.appointment_id = ?
       ORDER BY m.created_at ASC`,
      [appointmentId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Lỗi getAppointmentMessages:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Bulk delete counselor schedules
const bulkDeleteCounselorSchedules = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { scheduleIds } = req.body;
    
    console.log('bulkDeleteCounselorSchedules called:', { user_id, scheduleIds, body: req.body });

    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return res.status(400).json({ message: 'Danh sách ID lịch không hợp lệ' });
    }

    // Lấy counselor_profile_id từ user_id
    const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
    if (counselorProfiles.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy counselor profile' });
    }

    const counselor_profile_id = counselorProfiles[0].id;

    // Kiểm tra quyền - tất cả schedule phải thuộc về counselor này
    const placeholders = scheduleIds.map(() => '?').join(',');
    const schedules = await query(
      `SELECT id FROM counselor_schedules WHERE id IN (${placeholders}) AND counselor_id = ?`,
      [...scheduleIds, counselor_profile_id]
    );

    if (schedules.length !== scheduleIds.length) {
      return res.status(403).json({ message: 'Một số lịch không tồn tại hoặc không có quyền xóa' });
    }

    // Kiểm tra xem có appointment nào đã book trên các schedule này không
    const allAppointmentsOnSchedules = await query(
      `SELECT schedule_id, status FROM appointments WHERE schedule_id IN (${placeholders})`,
      scheduleIds
    );

    if (allAppointmentsOnSchedules.length > 0) {
      // Kiểm tra các appointment chưa hoàn thành
      const activeAppointments = allAppointmentsOnSchedules.filter(a => !['cancelled', 'completed'].includes(a.status));
      const uniqueSchedules = [...new Set(allAppointmentsOnSchedules.map(a => a.schedule_id))];
      
      if (activeAppointments.length > 0) {
        return res.status(400).json({ 
          message: `Không thể xóa ${uniqueSchedules.length} lịch vì có ${activeAppointments.length} lịch hẹn chưa hoàn thành. Vui lòng hủy hoặc hoàn thành các lịch hẹn này trước, hoặc xóa các lịch hẹn này ở trang quản lý lịch hẹn.`
        });
      } else {
        // Tất cả appointment đã completed/cancelled, nhưng vẫn có constraint
        return res.status(400).json({ 
          message: `Không thể xóa ${uniqueSchedules.length} lịch vì có ${allAppointmentsOnSchedules.length} lịch hẹn đã hoàn thành liên kết. Vui lòng xóa các lịch hẹn này ở trang quản lý lịch hẹn trước khi xóa lịch làm việc.`
        });
      }
    }

    // Xóa tất cả schedule được chọn
    await query(`DELETE FROM counselor_schedules WHERE id IN (${placeholders})`, scheduleIds);

    res.json({ message: `Đã xóa thành công ${scheduleIds.length} lịch làm việc` });
  } catch (error) {
    console.error('Lỗi bulkDeleteCounselorSchedules:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Delete appointment (counselor) - for schedule management
const deleteCounselorAppointment = async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const user_id = req.user.id;

      // Lấy counselor_profile_id từ user_id
      const counselorProfiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [user_id]);
      if (counselorProfiles.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy counselor profile' });
      }
      const counselor_profile_id = counselorProfiles[0].id;

      // Kiểm tra appointment có tồn tại và thuộc về counselor này không
      const appointments = await query('SELECT * FROM appointments WHERE id = ? AND counselor_id = ?', [appointmentId, counselor_profile_id]);
      if (appointments.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy lịch hẹn hoặc không có quyền' });
      }

      const appointment = appointments[0];

      // Xóa các bản ghi phụ thuộc theo thứ tự tránh lỗi FK
      await query('DELETE FROM messages WHERE appointment_id = ?', [appointmentId]);
      await query('DELETE FROM reviews WHERE appointment_id = ?', [appointmentId]);
      await query('DELETE FROM appointments WHERE id = ?', [appointmentId]);

      res.json({ message: 'Xóa lịch hẹn thành công' });
    } catch (error) {
      console.error('Lỗi deleteCounselorAppointment:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
};

// getMyAppointments function
const getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { counselor_user_id, status } = req.query;
    let where = 'a.patient_id = ?';
    const params = [userId];
    if (counselor_user_id) {
      where += ' AND cp.user_id = ?';
      params.push(parseInt(counselor_user_id, 10));
    }
    if (status) {
      where += ' AND a.status = ?';
      params.push(status);
    }
    const rows = await query(
      `SELECT a.* FROM appointments a
       JOIN counselor_profiles cp ON cp.id = a.counselor_id
       WHERE ${where}
       ORDER BY a.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error('getMyAppointments error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// delete appointment (patient)
const deleteAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointments = await query('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy appointment' });
    }

    const appointment = appointments[0];

    // Chỉ cho phép bệnh nhân của appointment xóa
    if (appointment.patient_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa lịch hẹn này' });
    }

    // Chỉ cho phép xóa khi chưa diễn ra hoặc đã hủy/hoàn thành
    if (['confirmed', 'in_progress'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Không thể xóa lịch đã xác nhận hoặc đang diễn ra' });
    }

    // Xóa các bản ghi phụ thuộc theo thứ tự tránh lỗi FK
    await query('DELETE FROM messages WHERE appointment_id = ?', [appointmentId]);
    await query('DELETE FROM reviews WHERE appointment_id = ?', [appointmentId]);

    await query('DELETE FROM appointments WHERE id = ?', [appointmentId]);

    res.json({ message: 'Xóa lịch hẹn thành công' });
  } catch (e) {
    console.error('deleteAppointment error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  bookAppointment,
  getPatientAppointments,
  getCounselorAppointments,
  updateAppointmentStatus,
  getCounselorSchedules,
  createCounselorSchedule,
  updateCounselorSchedule,
  deleteCounselorSchedule,
  bulkDeleteCounselorSchedules,
  deleteCounselorAppointment,
  bulkCreateCounselorSchedules,
  getAppointmentMessages,
  getMyAppointments,
  deleteAppointment
};
