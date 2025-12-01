const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Get all specialties (public route)
router.get('/', async (req, res) => {
  try {
    const specialties = await query('SELECT id, name FROM specialties ORDER BY name');
    res.json(specialties);
  } catch (error) {
    console.error('Lỗi getSpecialties:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;

