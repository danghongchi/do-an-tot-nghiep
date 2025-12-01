const { query } = require('../config/database');
const { createNotification } = require('../services/notificationService');

// Get reviews for a counselor by counselor user_id
const getReviewsForCounselor = async (req, res) => {
  try {
    const counselorUserId = parseInt(req.params.userId, 10);
    if (!Number.isFinite(counselorUserId)) {
      return res.status(400).json({ message: 'Tham số không hợp lệ' });
    }

    const profiles = await query('SELECT id FROM counselor_profiles WHERE user_id = ?', [counselorUserId]);
    if (!profiles.length) return res.json({ reviews: [], average: 0, count: 0 });
    const counselorProfileId = profiles[0].id;

    const rows = await query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.full_name AS patient_name
       FROM reviews r
       JOIN users u ON u.id = r.patient_id
       WHERE r.counselor_id = ?
       ORDER BY r.created_at DESC`,
      [counselorProfileId]
    );

    const count = rows.length;
    const average = count ? rows.reduce((s, r) => s + (r.rating || 0), 0) / count : 0;
    res.json({ reviews: rows, average: Number(average.toFixed(2)), count });
  } catch (e) {
    console.error('getReviewsForCounselor error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Create a review after appointment completed
const createReview = async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body || {};
    const userId = req.user.id;

    if (!appointment_id || !rating) {
      return res.status(400).json({ message: 'Thiếu dữ liệu' });
    }
    const rate = parseInt(rating, 10);
    if (!(rate >= 1 && rate <= 5)) {
      return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
    }

    // Verify appointment belongs to user and completed
    const apps = await query(
      `SELECT id, patient_id, counselor_id, status FROM appointments WHERE id = ?`,
      [appointment_id]
    );
    if (!apps.length) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn' });
    const app = apps[0];
    if (app.patient_id !== userId) return res.status(403).json({ message: 'Bạn không có quyền đánh giá lịch hẹn này' });
    if (app.status !== 'completed') return res.status(400).json({ message: 'Chỉ đánh giá sau khi buổi tư vấn hoàn tất' });

    // Check duplicate review
    const dup = await query('SELECT id FROM reviews WHERE appointment_id = ?', [appointment_id]);
    if (dup.length) return res.status(409).json({ message: 'Bạn đã đánh giá lịch hẹn này' });

    await query(
      `INSERT INTO reviews (appointment_id, patient_id, counselor_id, rating, comment, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [appointment_id, userId, app.counselor_id, rate, comment || null]
    );

    // Notify counselor about new review
    try {
      const [cpUser] = await query('SELECT user_id FROM counselor_profiles WHERE id = ?', [app.counselor_id]);
      if (cpUser) {
        await createNotification({
          user_id: cpUser.user_id,
          title: 'Bạn có đánh giá mới',
          message: `Khách hàng vừa đánh giá ${rate}/5 cho buổi tư vấn`,
          type: 'review',
          priority: 'normal',
          data: { appointment_id, rating: rate }
        });
      }
    } catch (_) {}

    res.json({ message: 'Gửi đánh giá thành công' });
  } catch (e) {
    console.error('createReview error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = { getReviewsForCounselor, createReview };

