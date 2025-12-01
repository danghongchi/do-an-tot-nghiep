const express = require('express');
const router = express.Router();
const { runMigration } = require('../controllers/migrationController');

// POST /api/migration/run - Run pending migrations
router.post('/run', runMigration);

module.exports = router;