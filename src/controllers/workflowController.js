/**
 * src/controllers/workflowController.js
 *
 * Handles the full workflow lifecycle:
 *  POST /api/workflow/generate   — task plan → n8n JSON via Claude
 *  POST /api/workflow/deploy     — n8n JSON → n8n Cloud (create + optional activate)
 *  POST /api/workflow/run/:id    — trigger a manual execution on n8n
 *  GET  /api/workflow            — list all workflows from n8n
 */

const fs   = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../utils/db');
const n8n = require('../services/n8nService');

// ─── Claude client (lazy singleton) ──────────────────────────────────────────
let _claude = null;
const getClient = () => {
  if (!_claude) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set.');
    }
    _claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _claude;
};

// ─── Load workflow-builder system prompt (cached) ────────────────────────────
let _systemPrompt = null;
const getSystemPrompt = () => {
  if (!_systemPrompt) {
    const p = path.join(__dirname, '../prompts/workflow-builder.md');
    _systemPrompt = fs.readFileSync(p, 'utf-8');
  }
  return _systemPrompt;
};

// ─── Helper: strip accidental markdown fences ────────────────────────────────
const stripFences = (text) =>
  text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/generate
// Body: { plan: object }  — the task plan produced by POST /api/chat
//
// Calls Claude with the workflow-builder prompt and returns a ready-to-import
// n8n workflow JSON. Does NOT deploy to n8n yet.
// ─────────────────────────────────────────────────────────────────────────────
const generate = async (req, res) => {
  const { plan } = req.body;

  if (!plan || typeof plan !== 'object') {
    return res.status(400).json({
      success: false,
      error: '`plan` is required and must be the JSON task plan object from POST /api/chat.',
    });
  }

  try {
    const client = getClient();
    const model  = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: JSON.stringify(plan, null, 2) }],
    });

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    let workflowJson;
    try {
      workflowJson = JSON.parse(stripFences(rawText));
    } catch {
      const err = new Error('Claude did not return valid n8n JSON.');
      err.status = 502;
      err.rawOutput = rawText;
      throw err;
    }

    return res.status(200).json({ success: true, data: workflowJson });
  } catch (err) {
    console.error('[WorkflowController.generate]', err.message);

    if (err.rawOutput !== undefined) {
      return res.status(502).json({
        success: false,
        error: 'Claude returned an unexpected response format.',
        ...(process.env.NODE_ENV !== 'production' && { raw: err.rawOutput }),
      });
    }
    if (err.status === 429) return res.status(429).json({ success: false, error: 'Rate limit reached.' });

    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/deploy
// Body: { taskId: string, workflowJson: object, activate?: boolean }
//
// 1. Pushes the n8n workflow JSON to n8n Cloud via n8nService.createWorkflow
// 2. Optionally activates it immediately if activate=true
// 3. Creates a run record in db.json and updates the task status
// ─────────────────────────────────────────────────────────────────────────────
const deploy = async (req, res) => {
  const { taskId, workflowJson, activate = false } = req.body;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ success: false, error: '`taskId` is required.' });
  }
  if (!workflowJson || typeof workflowJson !== 'object') {
    return res.status(400).json({ success: false, error: '`workflowJson` is required.' });
  }

  // Verify task exists
  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: `Task "${taskId}" not found.` });
  }

  try {
    // 1️⃣  Create workflow in n8n
    const created = await n8n.createWorkflow(workflowJson);
    const n8nId   = created.id;

    // 2️⃣  Optionally activate
    let activated = false;
    if (activate && n8nId) {
      await n8n.activateWorkflow(n8nId);
      activated = true;
    }

    // 3️⃣  Persist run record
    const now = new Date().toISOString();
    const run = {
      id:             uuidv4(),
      taskId,
      n8nWorkflowId:  n8nId,
      status:         'success',
      triggeredBy:    'deploy',
      stepsCompleted: workflowJson.nodes?.length ?? 0,
      stepsTotal:     workflowJson.nodes?.length ?? 0,
      activated,
      createdAt:      now,
      updatedAt:      now,
    };
    db.runs.push(run);

    // 4️⃣  Update task status and link n8n workflow id
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      status:        activated ? 'active' : 'deployed',
      n8nWorkflowId: n8nId,
      updatedAt:     now,
    };

    writeDB(db);

    return res.status(201).json({
      success: true,
      data: {
        run,
        n8nWorkflowId: n8nId,
        activated,
        workflowName:  created.name,
      },
    });
  } catch (err) {
    console.error('[WorkflowController.deploy]', err.message, err.n8nError ?? '');

    if (err.n8nError) {
      return res.status(502).json({
        success: false,
        error: `n8n API error (HTTP ${err.status}): ${err.message}`,
        ...(process.env.NODE_ENV !== 'production' && { detail: err.n8nError }),
      });
    }

    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/run/:n8nWorkflowId
// Triggers a manual test execution on n8n and records it in db.json.
// ─────────────────────────────────────────────────────────────────────────────
const triggerRun = async (req, res) => {
  const { n8nWorkflowId } = req.params;

  try {
    const execution = await n8n.executeWorkflow(n8nWorkflowId);

    const db  = readDB();
    const task = db.tasks.find((t) => t.n8nWorkflowId === n8nWorkflowId);
    const now  = new Date().toISOString();

    const run = {
      id:             uuidv4(),
      taskId:         task?.id ?? null,
      n8nWorkflowId,
      n8nExecutionId: execution.executionId ?? execution.id ?? null,
      status:         'running',
      triggeredBy:    'manual',
      createdAt:      now,
      updatedAt:      now,
    };

    db.runs.push(run);
    writeDB(db);

    return res.status(201).json({ success: true, data: run });
  } catch (err) {
    console.error('[WorkflowController.triggerRun]', err.message);
    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
      ...(err.n8nError && process.env.NODE_ENV !== 'production' ? { detail: err.n8nError } : {}),
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow
// Proxies the n8n workflow list to the frontend.
// ─────────────────────────────────────────────────────────────────────────────
const list = async (req, res) => {
  try {
    const workflows = await n8n.listWorkflows();
    return res.status(200).json({ success: true, count: workflows.length, data: workflows });
  } catch (err) {
    console.error('[WorkflowController.list]', err.message);
    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

module.exports = { generate, deploy, triggerRun, list };
