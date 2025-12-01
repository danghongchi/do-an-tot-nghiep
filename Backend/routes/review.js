const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/reviewController');

// Public: list reviews for counselor by user_id
router.get('/:userId', ctrl.getReviewsForCounselor);

// Protected: create review for a completed appointment
router.post('/', auth, ctrl.createReview);

module.exports = router;


