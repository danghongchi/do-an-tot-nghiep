const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { auth, counselorAuth, userAuth } = require('../middleware/auth');

// All appointment routes require authentication
router.use(auth);

// Book appointment (user only)
router.post('/', userAuth, appointmentController.bookAppointment);

// Patient: my appointments with optional filters
router.get('/my', userAuth, appointmentController.getMyAppointments);

// Patient: delete my appointment
router.delete('/:appointmentId', userAuth, appointmentController.deleteAppointment);

// Note: Patient and counselor appointments moved to their respective routes

// Update appointment status
router.put('/:appointmentId/status', appointmentController.updateAppointmentStatus);

// Get appointment messages
router.get('/:appointmentId/messages', appointmentController.getAppointmentMessages);

// Note: Counselor schedule management moved to /api/counselors

module.exports = router;
