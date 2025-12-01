const express = require('express');
const router = express.Router();
const counselorController = require('../controllers/counselorController');
const appointmentController = require('../controllers/appointmentController');
const { auth, counselorAuth, userAuth } = require('../middleware/auth');
const upload = require('../config/multer');
const { query } = require('../config/database');

// Public routes
router.get('/', counselorController.getCounselors);

// Counselor-only routes (must come before /:id to avoid conflicts)
router.get('/appointments', auth, counselorAuth, appointmentController.getCounselorAppointments);
router.delete('/appointments/:appointmentId', auth, counselorAuth, appointmentController.deleteCounselorAppointment);
router.get('/schedules', auth, counselorAuth, appointmentController.getCounselorSchedules);

// Revenue for current counselor (by auth user)
router.get('/me/revenue', auth, counselorAuth, async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const userId = req.user.id;
    const where = ["p.status = 'success'"];
    const params = [];
    if (from) { where.push('p.created_at >= ?'); params.push(from); }
    if (to) { where.push('p.created_at <= ?'); params.push(to + ' 23:59:59'); }
    const whereSql = where.length ? ('AND ' + where.join(' AND ')) : '';

    const total = await query(`SELECT COALESCE(SUM(p.amount),0) AS revenue, COUNT(*) AS num
                               FROM payments p
                               JOIN appointments a ON a.id = p.appointment_id
                               JOIN counselor_profiles cp ON a.counselor_id = cp.id
                               WHERE cp.user_id = ? ${whereSql}`, [userId, ...params]);
    const byMonth = await query(`SELECT DATE_FORMAT(p.created_at,'%Y-%m') AS month,
                                        COALESCE(SUM(p.amount),0) AS revenue,
                                        COUNT(*) AS num
                                 FROM payments p
                                 JOIN appointments a ON a.id = p.appointment_id
                                 JOIN counselor_profiles cp ON a.counselor_id = cp.id
                                 WHERE cp.user_id = ? ${whereSql}
                                 GROUP BY DATE_FORMAT(p.created_at,'%Y-%m')
                                 ORDER BY month DESC
                                 LIMIT 12`, [userId, ...params]);
    res.json({ total: total[0] || { revenue: 0, num: 0 }, byMonth });
  } catch (e) {
    console.error('counselor revenue error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Protected routes
router.get('/user/:userId', auth, counselorController.getCounselorByUserId);
router.put('/user/:userId', auth, counselorController.updateCounselorProfile);
router.post('/user/:userId/avatar', auth, counselorAuth, upload.single('avatar'), counselorController.uploadAvatar);

// Public routes with parameters (must come after specific routes)
router.get('/:id', counselorController.getCounselorById);
router.get('/:counselorId/schedule', counselorController.getCounselorSchedule);
router.post('/schedules', auth, counselorAuth, appointmentController.createCounselorSchedule);
router.delete('/schedules/bulk', auth, counselorAuth, appointmentController.bulkDeleteCounselorSchedules);
router.post('/schedules/bulk', auth, counselorAuth, appointmentController.bulkCreateCounselorSchedules);
router.put('/schedules/:scheduleId', auth, counselorAuth, appointmentController.updateCounselorSchedule);
router.delete('/schedules/:scheduleId', auth, counselorAuth, appointmentController.deleteCounselorSchedule);

module.exports = router;
