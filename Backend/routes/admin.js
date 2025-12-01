const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, adminAuth } = require('../middleware/auth');
const { query } = require('../config/database');

// All admin routes require authentication and admin role
router.use(auth, adminAuth);

// Specialties management (admin only)
router.get('/specialties', adminController.getSpecialties);
router.post('/specialties', adminController.createSpecialty);
router.put('/specialties/:id', adminController.updateSpecialty);
router.delete('/specialties/:id', adminController.deleteSpecialty);

// Counselor applications management
router.get('/counselor-applications', adminController.getCounselorApplications);
router.get('/counselor-applications/:id', adminController.getCounselorApplicationById);
router.put('/counselor-applications/:id/approve', adminController.approveCounselorApplication);
router.put('/counselor-applications/:id/reject', adminController.rejectCounselorApplication);
router.delete('/counselor-applications/:id', adminController.deleteCounselorApplication);

// Statistics
router.get('/stats', adminController.getAdminStats);

// Users management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/toggle-active', adminController.toggleUserActive);
router.delete('/users/:id', adminController.deleteUser);

// Counselors management
router.get('/counselors', adminController.getCounselors);
router.post('/counselors', adminController.createCounselor);
router.put('/counselors/:id', adminController.updateCounselor);
router.delete('/counselors/:id', adminController.deleteCounselor);

// Appointments management
router.get('/appointments-with-messages', adminController.getAppointmentsWithMessages);
router.get('/appointments/:appointmentId/messages', adminController.getAppointmentMessages);

// Chat management (using messages table)
router.get('/chats', adminController.getChats);
router.get('/chats/:id', adminController.getChatById);
router.get('/chats/:id/messages', adminController.getChatMessages);
router.delete('/chats/:id', adminController.deleteChat);

// Revenue summary (admin)
router.get('/revenue/summary', async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const where = ["p.status = 'success'"];
    const params = [];
    if (from) { where.push('p.created_at >= ?'); params.push(from); }
    if (to) { where.push('p.created_at <= ?'); params.push(to + ' 23:59:59'); }
    const whereSql = where.length ? ('WHERE ' + where.join(' AND ')) : '';

    const total = await query(`SELECT COALESCE(SUM(p.amount),0) AS revenue, COUNT(*) AS num
                               FROM payments p ${whereSql}`, params);
    const byMonth = await query(`SELECT DATE_FORMAT(p.created_at,'%Y-%m') AS month,
                                        COALESCE(SUM(p.amount),0) AS revenue,
                                        COUNT(*) AS num
                                 FROM payments p ${whereSql}
                                 GROUP BY DATE_FORMAT(p.created_at,'%Y-%m')
                                 ORDER BY month DESC
                                 LIMIT 12`, params);
    // Fallback from completed appointments without successful payment
    const aWhere = ["a.status = 'completed'"];
    const aParams = [];
    if (from) { aWhere.push('a.appointment_date >= ?'); aParams.push(from); }
    if (to) { aWhere.push('a.appointment_date <= ?'); aParams.push(to); }
    const aWhereSql = aWhere.length ? ('WHERE ' + aWhere.join(' AND ')) : '';

    const fallbackTotal = await query(`
      SELECT COALESCE(SUM(CASE WHEN a.appointment_type='online' THEN cp.online_price ELSE cp.offline_price END),0) AS revenue,
             COUNT(*) AS num
      FROM appointments a
      JOIN counselor_profiles cp ON a.counselor_id = cp.id
      LEFT JOIN payments p2 ON p2.appointment_id = a.id AND p2.status='success'
      ${aWhereSql} AND p2.id IS NULL
    `, aParams);

    const fallbackByMonth = await query(`
      SELECT DATE_FORMAT(a.appointment_date,'%Y-%m') AS month,
             COALESCE(SUM(CASE WHEN a.appointment_type='online' THEN cp.online_price ELSE cp.offline_price END),0) AS revenue,
             COUNT(*) AS num
      FROM appointments a
      JOIN counselor_profiles cp ON a.counselor_id = cp.id
      LEFT JOIN payments p2 ON p2.appointment_id = a.id AND p2.status='success'
      ${aWhereSql} AND p2.id IS NULL
      GROUP BY DATE_FORMAT(a.appointment_date,'%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `, aParams);

    const totalRevenue = Number(total[0]?.revenue || 0) + Number(fallbackTotal[0]?.revenue || 0);
    const totalNum = Number(total[0]?.num || 0) + Number(fallbackTotal[0]?.num || 0);

    const map = new Map();
    for (const r of byMonth) map.set(r.month, { month: r.month, revenue: Number(r.revenue||0), num: Number(r.num||0) });
    for (const r of fallbackByMonth) {
      const prev = map.get(r.month) || { month: r.month, revenue: 0, num: 0 };
      prev.revenue += Number(r.revenue || 0);
      prev.num += Number(r.num || 0);
      map.set(r.month, prev);
    }
    const mergedByMonth = Array.from(map.values()).sort((a,b)=> (a.month < b.month ? 1 : -1)).slice(0,12);

    res.json({ total: { revenue: totalRevenue, num: totalNum }, byMonth: mergedByMonth });
  } catch (e) {
    console.error('admin revenue summary error:', e);
    res.json({ total: { revenue: 0, num: 0 }, byMonth: [] });
  }
});

module.exports = router;
