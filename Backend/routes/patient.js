const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const userController = require('../controllers/userController');
const { auth, userAuth } = require('../middleware/auth');

// All patient routes require authentication and user role
router.use(auth, userAuth);

// Get patient appointments
router.get('/appointments', appointmentController.getPatientAppointments);

// Update patient profile
router.put('/profile', userController.updateProfile);

// Update patient settings (privacy/notifications)
router.put('/settings', userController.updateSettings);

module.exports = router;

