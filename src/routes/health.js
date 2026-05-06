const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Returns server health status and uptime info.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
