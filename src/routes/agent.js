const express = require('express');
const router = express.Router();
const { evaluateEvent } = require('../controllers/agentController');

/**
 * POST /api/agent/evaluate-event
 * Body: { platform, sender, text, metadata }
 * n8n sends normalized event JSON here for AI evaluation.
 */
router.post('/evaluate-event', evaluateEvent);

module.exports = router;
