const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');

/**
 * POST /api/chat
 * Body: { message: string }
 */
router.post('/', chat);

module.exports = router;
