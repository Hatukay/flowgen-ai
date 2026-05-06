const express = require('express');
const router  = express.Router();
const wf = require('../controllers/workflowController');

/**
 * POST /api/workflow/generate
 * Body: { plan: object }
 * Convert a task-planner JSON plan → n8n workflow JSON via Claude.
 */
router.post('/generate', wf.generate);

/**
 * POST /api/workflow/deploy
 * Body: { taskId: string, workflowJson: object, activate?: boolean }
 * Push workflow JSON to n8n Cloud, optionally activate it,
 * and record a run in db.json.
 */
router.post('/deploy', wf.deploy);

/**
 * POST /api/workflow/run/:n8nWorkflowId
 * Trigger a manual execution of an existing n8n workflow.
 */
router.post('/run/:n8nWorkflowId', wf.triggerRun);

/**
 * GET /api/workflow
 * List all workflows from n8n Cloud.
 */
router.get('/', wf.list);

module.exports = router;
