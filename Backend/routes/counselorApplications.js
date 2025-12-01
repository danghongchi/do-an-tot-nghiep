const express = require('express');
const router = express.Router();
const counselorController = require('../controllers/counselorController');
const { auth } = require('../middleware/auth');
const upload = require('../config/multer');

// Submit counselor application
router.post('/', auth, upload.fields([
  { name: 'qualification_documents', maxCount: 10 },
  { name: 'identity_documents', maxCount: 5 },
  { name: 'license_documents', maxCount: 5 }
]), counselorController.submitCounselorApplication);

// Get my application status
router.get('/my-status', auth, counselorController.getMyApplicationStatus);

module.exports = router;












