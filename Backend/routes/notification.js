const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { listNotifications, markAsRead, markAllAsRead, deleteReadNotifications, deleteNotification } = require('../services/notificationService');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const items = await listNotifications(req.user.id, req.query.limit || 20);
    res.json(items);
  } catch (e) {
    console.error('list notifications error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/:id/read', async (req, res) => {
  try {
    await markAsRead(req.params.id, req.user.id);
    res.json({ message: 'OK' });
  } catch (e) {
    console.error('mark notification read error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    await markAllAsRead(req.user.id);
    res.json({ message: 'OK' });
  } catch (e) {
    console.error('mark all notifications read error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Delete a single notification
router.delete('/:id', async (req, res) => {
  try {
    await deleteNotification(req.params.id, req.user.id);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('delete notification error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Delete all read notifications for current user
router.delete('/', async (req, res) => {
  try {
    await deleteReadNotifications(req.user.id);
    res.json({ message: 'Deleted read' });
  } catch (e) {
    console.error('delete read notifications error:', e);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;



