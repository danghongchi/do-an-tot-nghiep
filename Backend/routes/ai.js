const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { auth, optionalAuth } = require('../middleware/auth');

// AI routes
router.get('/health', aiController.testGemini);
router.post('/suggest-counselors', aiController.suggestCounselors);

// AI chat - cho phép cả người dùng đã đăng nhập và chưa đăng nhập
router.post('/chat', optionalAuth, aiController.chatWithAI);

// Protected AI routes - chỉ cho người dùng đã đăng nhập
router.get('/chat/history', auth, aiController.getAIChatHistory);
router.delete('/chat/history', auth, aiController.clearAIChatHistory);

module.exports = router;

