const qs = require('qs');
const crypto = require('crypto');
const config = require('../../config');
const { query } = require('../../config/database');
const { createNotification } = require('../notificationService');
const { sendPaymentSuccessEmail, sendNewAppointmentToCounselor } = require('../emailService');

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) sorted[k] = obj[k];
  return sorted;
};

// Build sign string exactly like when creating URL: encode each value and replace spaces with '+'
const buildSignData = (params) => {
  return Object.keys(params)
    .map(k => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
    .join('&');
};

const formatYYYYMMDDHHmmss = (date) => {
  const pad = (n) => String(n).toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
};

// POST /api/payment/create
exports.createPaymentUrl = async (req, res) => {
  try {
    const { bookingId, bankCode } = req.body || {};
    const userId = req.user.id;

    console.log('[createPaymentUrl] Request data:', { bookingId, bankCode, userId });

    if (!bookingId) {
      return res.status(400).json({ message: 'Thiếu bookingId' });
    }

    // Validate appointment ownership and resolve amount on server (avoid client tampering)
    const appRows = await query(
      `SELECT a.id, a.patient_id, a.appointment_type,
              cp.online_price, cp.offline_price
       FROM appointments a
       JOIN counselor_profiles cp ON cp.id = a.counselor_id
       WHERE a.id = ? AND a.patient_id = ?
       LIMIT 1`,
      [bookingId, userId]
    );
    if (appRows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn hoặc không có quyền' });
    }
    const app = appRows[0];
    let amount = Number(app.appointment_type === 'offline' ? app.offline_price : app.online_price);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Không xác định được số tiền cho lịch hẹn' });
    }

    const vnp = config.vnpay;
    const date = new Date();
    const createDate = formatYYYYMMDDHHmmss(date);
    let ipAddr = (req.headers['x-forwarded-for'] || req.connection?.remoteAddress || req.ip || '').toString();
    if (!ipAddr || ipAddr === '::1' || ipAddr === '::ffff:127.0.0.1') ipAddr = '127.0.0.1';

    // vnp_TxnRef must be 8-32 alphanumeric per spec; remove non-alphanumerics
    const orderId = `${bookingId}${Date.now()}`.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);

    // Put bookingId into OrderInfo as JSON for robust IPN parsing
    const orderInfo = JSON.stringify({ bookingId: Number(bookingId) });

    let vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnp.tmnCode,
      vnp_Locale: vnp.locale,
      vnp_CurrCode: vnp.currCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(Number(amount)) * 100,
      vnp_ReturnUrl: vnp.returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: formatYYYYMMDDHHmmss(new Date(date.getTime() + 15 * 60 * 1000))
    };

    if (bankCode) vnpParams.vnp_BankCode = bankCode;

    vnpParams = sortObject(vnpParams);
    // Build signData per VNPAY spec: encode each value and replace spaces with '+'
    const signData = Object.keys(vnpParams)
      .map(k => `${k}=${encodeURIComponent(vnpParams[k]).replace(/%20/g, '+')}`)
      .join('&');
    const hmac = crypto.createHmac('sha512', vnp.hashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();
    // Redirect with URL-encoded query string per VNPAY spec
    const encodedQuery = Object.keys(vnpParams)
      .map(k => `${k}=${encodeURIComponent(vnpParams[k])}`)
      .join('&');
    const paymentUrl = `${vnp.vnpUrl}?${encodedQuery}&vnp_SecureHashType=HMACSHA512&vnp_SecureHash=${vnp_SecureHash}`;

    // Log essentials for troubleshooting (do not log secrets)
    try {
      console.log('[VNPAY][createPaymentUrl] Params (sorted, raw):', vnpParams);
      console.log('[VNPAY][createPaymentUrl] signData (encode=false):', signData);
      console.log('[VNPAY][createPaymentUrl] vnp_SecureHash (UPPER):', vnp_SecureHash.substring(0, 10) + '...');
      console.log('[VNPAY][createPaymentUrl] Redirect URL:', paymentUrl);
    } catch (_) {}

    // Save a pending payment log (optional)
    try {
      await query(
        'INSERT INTO payments (appointment_id, amount, gateway, status, txn_ref, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [bookingId, Number(amount), 'vnpay', 'pending', orderId]
      );
    } catch (_) {}

    return res.json({ paymentUrl });
  } catch (e) {
    console.error('createPaymentUrl error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// GET /api/payment/ipn
exports.ipnHandler = async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const sorted = sortObject(vnpParams);
    const signData = buildSignData(sorted);
    const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

      if ((secureHash || '').toUpperCase() !== signed) {
        return res.status(200).json({ RspCode: '97', Message: 'Invalid signature' });
      }

    const rspCode = vnpParams.vnp_ResponseCode;
    const orderInfo = vnpParams.vnp_OrderInfo || '';
      // Prefer parse bookingId from JSON orderInfo
      let bookingId = NaN;
      try {
        const oi = JSON.parse(orderInfo);
        if (oi && Number.isFinite(Number(oi.bookingId))) bookingId = Number(oi.bookingId);
      } catch (_) {}
      // Fallbacks: extract from numeric content; if using `${bookingId}${Date.now()}` then strip last 13 digits (timestamp)
      if (!Number.isFinite(bookingId)) {
        const m = String(orderInfo).match(/(\d+)/);
        if (m && m[1]) {
          const s = m[1];
          bookingId = s.length > 13 ? parseInt(s.slice(0, s.length - 13), 10) : parseInt(s, 10);
        }
      }
      if (!Number.isFinite(bookingId)) {
        const digits = String(vnpParams.vnp_TxnRef || '').replace(/\D/g, '');
        if (digits) bookingId = digits.length > 13 ? parseInt(digits.slice(0, digits.length - 13), 10) : parseInt(digits, 10);
      }
    const txnRef = vnpParams.vnp_TxnRef;
    const amount = Number(vnpParams.vnp_Amount || 0) / 100;

    if (!bookingId) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    // Idempotency
    try {
      const existing = await query('SELECT status FROM payments WHERE txn_ref = ? LIMIT 1', [txnRef]);
      if (existing.length > 0 && existing[0].status === 'success') {
        return res.status(200).json({ RspCode: '00', Message: 'Already processed' });
      }
    } catch (_) {}

    if (rspCode === '00') {
      // Payment success - chuyển từ payment_pending sang pending để counselor có thể xác nhận
      try { await query('UPDATE appointments SET status = "confirmed" WHERE id = ? AND status = "payment_pending"', [bookingId]); } catch (_) {}
      try {
        await query(
          'INSERT INTO payments (appointment_id, amount, gateway, status, txn_ref, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), raw_data = VALUES(raw_data)',
          [bookingId, amount, 'vnpay', 'success', txnRef, JSON.stringify(req.query)]
        );
      } catch (_) {}
      // Notify patient and counselor AFTER successful payment
      try {
        const apps = await query(
          `SELECT a.*, 
                  cp.user_id AS counselor_user_id,
                  cu.email AS counselor_email,
                  cu.full_name AS counselor_name,
                  pu.email AS patient_email,
                  pu.full_name AS patient_name
           FROM appointments a 
           JOIN counselor_profiles cp ON cp.id = a.counselor_id
           JOIN users cu ON cu.id = cp.user_id
           JOIN users pu ON pu.id = a.patient_id
           WHERE a.id = ?`, 
          [bookingId]
        );
        if (apps.length) {
          const app = apps[0];
          
          // Notify patient
          await createNotification({
            user_id: app.patient_id,
            title: 'Thanh toán thành công',
            message: 'Lịch hẹn đã được xác nhận, vui lòng chờ chuyên gia phản hồi.',
            type: 'payment',
            priority: 'high',
            data: { appointment_id: bookingId, amount }
          });
          
          // Send payment success email to patient
          if (app.patient_email) {
            await sendPaymentSuccessEmail(app.patient_email, {
              userName: app.patient_name,
              appointmentId: bookingId,
              appointmentDate: app.appointment_date,
              appointmentTime: app.appointment_time,
              appointmentType: app.appointment_type,
              counselorName: app.counselor_name,
              amount: amount,
              gateway: 'VNPAY',
              txnRef: txnRef
            });
          }
          
          // Notify counselor
          if (app.counselor_user_id) {
            await createNotification({
              user_id: app.counselor_user_id,
              title: 'Lịch hẹn mới',
              message: 'Bạn có một lịch hẹn mới đã được thanh toán.',
              type: 'appointment',
              priority: 'high',
              data: { appointment_id: bookingId, date: app.appointment_date, time: app.appointment_time }
            });
            
            // Send email to counselor about new appointment
            if (app.counselor_email) {
              const isAnonymous = app.is_anonymous || (app.notes && app.notes.includes('[ANON=1]'));
              await sendNewAppointmentToCounselor(app.counselor_email, {
                counselorName: app.counselor_name,
                patientName: app.patient_name,
                appointmentId: bookingId,
                appointmentDate: app.appointment_date,
                appointmentTime: app.appointment_time,
                appointmentType: app.appointment_type,
                notes: app.notes ? app.notes.replace(/^\[ANON=1\]\s*/, '') : '',
                isAnonymous: isAnonymous
              });
            }
          }
        }
      } catch (_) {}
      return res.status(200).json({ RspCode: '00', Message: 'Success' });
    } else {
      // Payment failed - xóa appointment chưa thanh toán
      try {
        await query('DELETE FROM appointments WHERE id = ? AND status = "payment_pending"', [bookingId]);
      } catch (_) {}
      try {
        await query(
          'INSERT INTO payments (appointment_id, amount, gateway, status, txn_ref, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), raw_data = VALUES(raw_data)',
          [bookingId, amount, 'vnpay', 'failed', txnRef, JSON.stringify(req.query)]
        );
      } catch (_) {}
      try {
        const apps = await query('SELECT patient_id FROM appointments WHERE id = ?', [bookingId]);
        if (apps.length) {
          await createNotification({
            user_id: apps[0].patient_id,
            title: 'Thanh toán thất bại',
            message: 'Thanh toán không thành công. Lịch hẹn đã bị hủy, vui lòng đặt lại.',
            type: 'payment',
            priority: 'normal',
            data: { appointment_id: bookingId, amount }
          });
        }
      } catch (_) {}
      return res.status(200).json({ RspCode: '00', Message: 'Fail recorded' });
    }
  } catch (e) {
    console.error('ipnHandler error:', e);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// Return URL handler - tương tự IPN nhưng redirect user
exports.returnHandler = async (req, res) => {
  try {
    console.log('[VNPAY][returnHandler] Query params:', req.query);
    
    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

      const sorted = sortObject(vnpParams);
      const signData = buildSignData(sorted);
      const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex').toUpperCase();

      const rspCode = vnpParams.vnp_ResponseCode;
      const orderInfo = vnpParams.vnp_OrderInfo || '';
    
      // Parse bookingId
      let bookingId = NaN;
      try {
        const oi = JSON.parse(orderInfo);
        if (oi && Number.isFinite(Number(oi.bookingId))) bookingId = Number(oi.bookingId);
      } catch (_) {}
      if (!Number.isFinite(bookingId)) {
        // If OrderInfo lost, fall back to vnp_TxnRef which is `${bookingId}${Date.now()}` possibly truncated
        const digits = String(vnpParams.vnp_TxnRef || '').replace(/\D/g, '');
        if (digits) bookingId = digits.length > 13 ? parseInt(digits.slice(0, digits.length - 13), 10) : parseInt(digits, 10);
      }
    
    const txnRef = vnpParams.vnp_TxnRef;
    const amount = Number(vnpParams.vnp_Amount || 0) / 100;

      if ((secureHash || '').toUpperCase() !== signed) {
        console.log('[VNPAY][returnHandler] Invalid signature');
        return res.redirect(`${config.frontendUrl}/payment/result?status=error&message=Invalid signature`);
      }

    if (!bookingId) {
      console.log('[VNPAY][returnHandler] Order not found');
      return res.redirect(`${config.frontendUrl}/payment/result?status=error&message=Order not found`);
    }

    // Xử lý thanh toán (tương tự IPN)
    if (rspCode === '00') {
      // Idempotency check
      try {
        const existing = await query('SELECT status FROM payments WHERE txn_ref = ? LIMIT 1', [txnRef]);
        if (existing.length > 0 && existing[0].status === 'success') {
          console.log('[VNPAY][returnHandler] Already processed');
          return res.redirect(`${config.frontendUrl}/payment/result?status=success&appointmentId=${bookingId}`);
        }
      } catch (_) {}

      // Payment success - chuyển từ payment_pending sang pending
      try { 
        const result = await query('UPDATE appointments SET status = "confirmed" WHERE id = ? AND status = "payment_pending"', [bookingId]); 
        console.log(`[VNPAY][returnHandler] Updated appointment ${bookingId} status to confirmed, affected rows: ${result.affectedRows}`);
      } catch (e) {
        console.error('[VNPAY][returnHandler] Error updating appointment:', e);
      }
      
      try {
        await query(
          'INSERT INTO payments (appointment_id, amount, gateway, status, txn_ref, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), raw_data = VALUES(raw_data)',
          [bookingId, amount, 'vnpay', 'success', txnRef, JSON.stringify(req.query)]
        );
        console.log(`[VNPAY][returnHandler] Saved payment record for appointment ${bookingId}`);
      } catch (e) {
        console.error('[VNPAY][returnHandler] Error saving payment:', e);
      }
      
      // Notify patient and counselor
      try {
        const apps = await query(
          `SELECT a.*, 
                  cp.user_id AS counselor_user_id,
                  cu.email AS counselor_email,
                  cu.full_name AS counselor_name,
                  pu.email AS patient_email,
                  pu.full_name AS patient_name
           FROM appointments a 
           JOIN counselor_profiles cp ON cp.id = a.counselor_id
           JOIN users cu ON cu.id = cp.user_id
           JOIN users pu ON pu.id = a.patient_id
           WHERE a.id = ?`, 
          [bookingId]
        );
        if (apps.length) {
          const app = apps[0];
          
          // Notify patient
          await createNotification({
            user_id: app.patient_id,
            title: 'Thanh toán thành công',
            message: 'Lịch hẹn đã được xác nhận, vui lòng chờ chuyên gia phản hồi.',
            type: 'payment',
            priority: 'high',
            data: { appointment_id: bookingId, amount }
          });
          console.log(`[VNPAY][returnHandler] Notified patient ${app.patient_id}`);
          
          // Send payment success email to patient
          if (app.patient_email) {
            await sendPaymentSuccessEmail(app.patient_email, {
              userName: app.patient_name,
              appointmentId: bookingId,
              appointmentDate: app.appointment_date,
              appointmentTime: app.appointment_time,
              appointmentType: app.appointment_type,
              counselorName: app.counselor_name,
              amount: amount,
              gateway: 'VNPAY',
              txnRef: txnRef
            });
            console.log(`[VNPAY][returnHandler] Sent payment success email to patient ${app.patient_email}`);
          }
          
          // Notify counselor
          if (app.counselor_user_id) {
            await createNotification({
              user_id: app.counselor_user_id,
              title: 'Lịch hẹn mới',
              message: 'Bạn có một lịch hẹn mới đã được thanh toán.',
              type: 'appointment',
              priority: 'high',
              data: { appointment_id: bookingId, date: app.appointment_date, time: app.appointment_time }
            });
            console.log(`[VNPAY][returnHandler] Notified counselor ${app.counselor_user_id}`);
            
            // Send email to counselor about new appointment
            if (app.counselor_email) {
              const isAnonymous = app.is_anonymous || (app.notes && app.notes.includes('[ANON=1]'));
              await sendNewAppointmentToCounselor(app.counselor_email, {
                counselorName: app.counselor_name,
                patientName: app.patient_name,
                appointmentId: bookingId,
                appointmentDate: app.appointment_date,
                appointmentTime: app.appointment_time,
                appointmentType: app.appointment_type,
                notes: app.notes ? app.notes.replace(/^\[ANON=1\]\s*/, '') : '',
                isAnonymous: isAnonymous
              });
              console.log(`[VNPAY][returnHandler] Sent new appointment email to counselor ${app.counselor_email}`);
            }
          }
        }
      } catch (e) {
        console.error('[VNPAY][returnHandler] Error sending notifications:', e);
      }
      
      return res.redirect(`${config.frontendUrl}/payment/result?status=success&appointmentId=${bookingId}`);
    } else {
      // Payment failed - xóa appointment
      try {
        const result = await query('DELETE FROM appointments WHERE id = ? AND status = "payment_pending"', [bookingId]);
        console.log(`[VNPAY][returnHandler] Deleted failed payment appointment ${bookingId}, affected rows: ${result.affectedRows}`);
      } catch (e) {
        console.error('[VNPAY][returnHandler] Error deleting appointment:', e);
      }
      
      try {
        await query(
          'INSERT INTO payments (appointment_id, amount, gateway, status, txn_ref, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE status = VALUES(status), raw_data = VALUES(raw_data)',
          [bookingId, amount, 'vnpay', 'failed', txnRef, JSON.stringify(req.query)]
        );
      } catch (_) {}
      
      return res.redirect(`${config.frontendUrl}/payment/result?status=failed&message=Payment failed`);
    }
  } catch (e) {
    console.error('[VNPAY][returnHandler] error:', e);
    return res.redirect(`${config.frontendUrl}/payment/result?status=error&message=System error`);
  }
};
