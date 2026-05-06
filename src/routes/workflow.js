const express = require('express');
const router = express.Router();
const wf = require('../controllers/workflowController');

router.post('/generate', wf.generate);
router.post('/deploy', wf.deploy);
router.post('/run/:n8nWorkflowId', wf.triggerRun);
router.get('/', wf.list);

module.exports = router;
