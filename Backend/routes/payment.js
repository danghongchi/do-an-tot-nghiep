const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, userAuth } = require('../middleware/auth');
const { query } = require('../config/database');

// Create payment URL for a booking
router.post('/create', auth, userAuth, paymentController.createPaymentUrl);

// IPN callback from VNPAY
router.get('/ipn', paymentController.ipnHandler);

// Return URL handler - xử lý khi user quay về từ VNPAY
router.get('/return', paymentController.returnHandler);

// Test endpoint để manually process payment
router.post('/test-process', auth, userAuth, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    
    console.log(`[TEST] Processing payment for appointment ${appointmentId}`);
    
    // Update appointment status (confirm immediately in test mode)
    const result = await query('UPDATE appointments SET status = "confirmed" WHERE id = ? AND status = "payment_pending"', [appointmentId]);
    console.log(`[TEST] Updated appointment ${appointmentId}, affected rows: ${result.affectedRows}`);
    
    // Create payment record
    await query(
      'INSERT INTO payments (appointment_id, amount, gateway, status, txn_ref, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [appointmentId, 600000, 'test', 'success', `test-${appointmentId}-${Date.now()}`, JSON.stringify({ test: true })]
    );
    console.log(`[TEST] Created payment record for appointment ${appointmentId}`);
    
    // Send notifications
    const apps = await query('SELECT a.*, cp.user_id AS counselor_user_id FROM appointments a JOIN counselor_profiles cp ON cp.id = a.counselor_id WHERE a.id = ?', [appointmentId]);
    if (apps.length) {
      const app = apps[0];
      
      const { createNotification } = require('../services/notificationService');
      
      await createNotification({
        user_id: app.patient_id,
        title: 'Thanh toán thành công (Test)',
        message: 'Lịch hẹn đã được xác nhận, vui lòng chờ chuyên gia phản hồi.',
        type: 'payment',
        priority: 'high',
        data: { appointment_id: appointmentId, amount: 600000 }
      });
      console.log(`[TEST] Notified patient ${app.patient_id}`);
      
      if (app.counselor_user_id) {
        await createNotification({
          user_id: app.counselor_user_id,
          title: 'Lịch hẹn mới (Test)',
          message: 'Bạn có một lịch hẹn mới đã được thanh toán.',
          type: 'appointment',
          priority: 'high',
          data: { appointment_id: appointmentId, date: app.appointment_date, time: app.appointment_time }
        });
        console.log(`[TEST] Notified counselor ${app.counselor_user_id}`);
      }
    }
    
    res.json({ success: true, message: 'Payment processed successfully', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('[TEST] Error processing payment:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Payment history for current user
router.get('/history', auth, userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 50 } = req.query;
    
    // Build WHERE clause with optional status filter
    let whereClause = 'WHERE a.patient_id = ?';
    const params = [userId];
    
    if (status && ['success', 'pending', 'failed'].includes(status)) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      JOIN appointments a ON a.id = p.appointment_id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results with full details
    const rows = await query(
      `SELECT p.*, 
              a.appointment_date, 
              a.appointment_time, 
              a.appointment_type,
              a.status AS appointment_status,
              cp.id AS counselor_id,
              u.full_name AS counselor_name,
              s.name AS counselor_specialty
       FROM payments p
       JOIN appointments a ON a.id = p.appointment_id
       JOIN counselor_profiles cp ON cp.id = a.counselor_id
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN specialties s ON s.id = cp.specialty_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    
    res.json({
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    console.error('payment history error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Export payment history to CSV
router.get('/history/export', auth, userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    let whereClause = 'WHERE a.patient_id = ?';
    const params = [userId];
    
    if (status && ['success', 'pending', 'failed'].includes(status)) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    
    const rows = await query(
      `SELECT p.id,
              p.txn_ref AS 'Mã GD',
              p.amount AS 'Số tiền',
              p.gateway AS 'Cổng thanh toán',
              p.status AS 'Trạng thái',
              p.created_at AS 'Ngày thanh toán',
              a.appointment_date AS 'Ngày hẹn',
              a.appointment_time AS 'Giờ hẹn',
              a.appointment_type AS 'Loại hẹn',
              u.full_name AS 'Chuyên gia',
              s.name AS 'Chuyên môn'
       FROM payments p
       JOIN appointments a ON a.id = p.appointment_id
       JOIN counselor_profiles cp ON cp.id = a.counselor_id
       JOIN users u ON u.id = cp.user_id
       LEFT JOIN specialties s ON s.id = cp.specialty_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );
    
    // Create CSV content
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không có dữ liệu để xuất' });
    }
    
    const headers = Object.keys(rows[0]).filter(k => k !== 'id');
    const csvRows = [headers.join(',')];
    
    for (const row of rows) {
      const values = headers.map(h => {
        const val = row[h];
        // Escape quotes and wrap in quotes if contains comma
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') ? `"${str}"` : str;
      });
      csvRows.push(values.join(','));
    }
    
    const csv = csvRows.join('\n');
    const filename = `payment_history_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // Add BOM for Excel UTF-8 support
  } catch (e) {
    console.error('export payment history error:', e);
    res.status(500).json({ message: 'Lỗi server khi xuất dữ liệu' });
  }
});

// Delete payment history record
router.delete('/history/:id', auth, userAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.id;
    
    // Check if payment belongs to current user
    const payments = await query(
      `SELECT p.* FROM payments p
       JOIN appointments a ON a.id = p.appointment_id
       WHERE p.id = ? AND a.patient_id = ?`,
      [paymentId, userId]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch hoặc bạn không có quyền xóa' });
    }
    
    // Delete payment record
    await query('DELETE FROM payments WHERE id = ?', [paymentId]);
    
    res.json({ success: true, message: 'Xóa lịch sử thanh toán thành công' });
  } catch (e) {
    console.error('delete payment history error:', e);
    res.status(500).json({ message: 'Lỗi server khi xóa giao dịch' });
  }
});

module.exports = router;
