const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { auth, counselorAuth, userAuth } = require('../middleware/auth');

// All chat routes require authentication
router.use(auth);

// Anonymous chat routes removed after integration into booking flow

module.exports = router;




