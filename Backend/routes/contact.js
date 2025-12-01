const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Public route - anyone can submit contact form
router.post('/', contactController.submitContactForm);

module.exports = router;
