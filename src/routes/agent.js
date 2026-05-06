const express = require('express');
const router = express.Router();
const { evaluateEvent } = require('../controllers/agentController');

router.post('/evaluate-event', evaluateEvent);

module.exports = router;
