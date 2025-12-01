const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Public routes
const required = (fields) => (req, res, next) => {
  for (const f of fields) {
    const v = req.body?.[f];
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      return res.status(400).json({ message: `Thiếu trường bắt buộc: ${f}` });
    }
  }
  next();
};

router.post('/register', required(['full_name','email','password']), authController.register);
router.post('/login', required(['email','password']), authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', required(['token','newPassword']), authController.resetPassword);
router.post('/verify-email', required(['token']), authController.verifyEmail);
router.post('/resend-verification', required(['email']), authController.resendVerificationEmail);
// Social OAuth
router.post('/oauth', required(['provider','token']), authController.oauthLogin);

// Protected routes
router.get('/me', auth, authController.getMe);
router.post('/change-password', auth, authController.changePassword);

module.exports = router;
