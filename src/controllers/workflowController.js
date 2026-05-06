const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../utils/db');
const { createRunLog } = require('../utils/contracts');
const { generateWorkflowJson } = require('../services/geminiService');
const n8n = require('../services/n8nService');

const generate = async (req, res) => {
  const { plan } = req.body;

  if (!plan || typeof plan !== 'object') {
    return res.status(400).json({
      success: false,
      error: '`plan` is required and must be the JSON task plan object from POST /api/chat.',
    });
  }

  try {
    const workflowJson = await generateWorkflowJson(plan);
    return res.status(200).json({ success: true, data: workflowJson });
  } catch (err) {
    console.error('[WorkflowController.generate]', err.message);
    if (err.rawOutput !== undefined) {
      return res.status(502).json({
        success: false,
        error: 'Gemini returned an unexpected workflow JSON format.',
        ...(process.env.NODE_ENV !== 'production' && { raw: err.rawOutput }),
      });
    }
    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

const deploy = async (req, res) => {
  const { taskId, workflowJson, activate = false } = req.body;

  if (!taskId || typeof taskId !== 'string') {
    return res.status(400).json({ success: false, error: '`taskId` is required.' });
  }
  if (!workflowJson || typeof workflowJson !== 'object') {
    return res.status(400).json({ success: false, error: '`workflowJson` is required.' });
  }

  const db = readDB();
  const taskIndex = db.tasks.findIndex((task) => task.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ success: false, error: `Task "${taskId}" not found.` });
  }

  try {
    const created = await n8n.createWorkflow(workflowJson);
    const n8nId = created.id;

    let activated = false;
    if (activate && n8nId) {
      await n8n.activateWorkflow(n8nId);
      activated = true;
    }

    const now = new Date().toISOString();
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      status: activated ? 'active' : db.tasks[taskIndex].status,
      n8nWorkflowId: n8nId,
      updatedAt: now,
    };

    const run = createRunLog({
      id: `run_${uuidv4()}`,
      taskId,
      status: 'success',
      platform: 'system',
      actionPlatform: db.tasks[taskIndex].action?.platform ?? null,
      summary: 'n8n workflow deploy istegi tamamlandi.',
      reason: activated ? 'Workflow n8n uzerinde olusturuldu ve aktive edildi.' : 'Workflow n8n uzerinde olusturuldu.',
      details: { n8nWorkflowId: n8nId, workflowName: created.name, activated },
      createdAt: now,
    });
    db.runs.push(run);
    writeDB(db);

    return res.status(201).json({
      success: true,
      data: { run, n8nWorkflowId: n8nId, activated, workflowName: created.name },
    });
  } catch (err) {
    console.error('[WorkflowController.deploy]', err.message, err.n8nError ?? '');
    return res.status(err.n8nError ? 502 : 500).json({
      success: false,
      error: err.n8nError ? `n8n API error (HTTP ${err.status}): ${err.message}` : err.message,
      ...(err.n8nError && process.env.NODE_ENV !== 'production' ? { detail: err.n8nError } : {}),
    });
  }
};

const triggerRun = async (req, res) => {
  const { n8nWorkflowId } = req.params;

  try {
    const execution = await n8n.executeWorkflow(n8nWorkflowId);
    const db = readDB();
    const task = db.tasks.find((item) => item.n8nWorkflowId === n8nWorkflowId);
    const run = createRunLog({
      taskId: task?.id ?? null,
      status: 'success',
      platform: 'system',
      actionPlatform: task?.action?.platform ?? null,
      summary: 'n8n workflow manuel test calistirmasi baslatildi.',
      reason: 'n8n execute endpointinden execution id alindi.',
      details: { n8nWorkflowId, n8nExecutionId: execution.executionId ?? execution.id ?? null },
    });
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
