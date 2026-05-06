const https = require('https');
const http  = require('http');
const url   = require('url');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../utils/db');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks
// Returns every task stored in db.json.
// ─────────────────────────────────────────────────────────────────────────────
const getAllTasks = (req, res) => {
  try {
    const { tasks } = readDB();
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks/:id
// ─────────────────────────────────────────────────────────────────────────────
const getTaskById = (req, res) => {
  try {
    const { tasks } = readDB();
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks
// Body: { name: string, description?: string, [extra fields] }
// ─────────────────────────────────────────────────────────────────────────────
const createTask = (req, res) => {
  const { name, description } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '`name` is required and must be a non-empty string.',
    });
  }

  try {
    const db = readDB();
    const now = new Date().toISOString();

    const task = {
      id:          uuidv4(),
      name:        name.trim(),
      description: description?.trim() ?? '',
      createdAt:   now,
      updatedAt:   now,
      // Allow any extra fields from the body (workflow plan, tags, etc.)
      ...Object.fromEntries(
        Object.entries(req.body).filter(([k]) => !['name', 'description'].includes(k))
      ),
    };

    db.tasks.push(task);
    writeDB(db);

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tasks/:id
// ─────────────────────────────────────────────────────────────────────────────
const updateTask = (req, res) => {
  try {
    const db    = readDB();
    const index = db.tasks.findIndex((t) => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    db.tasks[index] = {
      ...db.tasks[index],
      ...req.body,
      id:        db.tasks[index].id,       // immutable
      createdAt: db.tasks[index].createdAt, // immutable
      updatedAt: new Date().toISOString(),
    };

    writeDB(db);
    res.status(200).json({ success: true, data: db.tasks[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteTask = (req, res) => {
  try {
    const db    = readDB();
    const index = db.tasks.findIndex((t) => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    const [removed] = db.tasks.splice(index, 1);
    writeDB(db);
    res.status(200).json({ success: true, data: removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks/:id/approve
//
// 1. Finds the task in db.json (404 if missing)
// 2. Sets status → 'active'
// 3. Fires N8N_WEBHOOK_URL (fire-and-forget; failure is non-fatal)
// 4. Creates a run record with status 'success'
// 5. Persists everything to db.json
// 6. Returns { success: true, task, run }
// ─────────────────────────────────────────────────────────────────────────────
const approveTask = async (req, res) => {
  try {
    const db    = readDB();
    const index = db.tasks.findIndex((t) => t.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    const now = new Date().toISOString();

    // ── 1. Approve: set status to active ─────────────────────────────────────
    db.tasks[index] = {
      ...db.tasks[index],
      status:    'active',
      updatedAt: now,
    };
    const task = db.tasks[index];

    // ── 2. Fire n8n webhook (optional — non-fatal) ────────────────────────────
    let webhookFired   = false;
    let webhookError   = null;

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await new Promise((resolve, reject) => {
          const parsed  = url.parse(webhookUrl);
          const isHttps = parsed.protocol === 'https:';
          const lib     = isHttps ? https : http;
          const payload = JSON.stringify({ taskId: task.id, status: 'active', approvedAt: now });

          const req2 = lib.request(
            {
              hostname: parsed.hostname,
              port:     parsed.port || (isHttps ? 443 : 80),
              path:     parsed.path,
              method:   'POST',
              headers:  {
                'Content-Type':   'application/json',
                'Content-Length': Buffer.byteLength(payload),
              },
            },
            (res2) => {
              res2.resume(); // drain response — we don't need the body
              resolve();
            }
          );
          req2.on('error', reject);
          req2.write(payload);
          req2.end();
        });
        webhookFired = true;
      } catch (e) {
        webhookError = e.message;
        console.warn('[ApproveTask] N8N_WEBHOOK_URL call failed (non-fatal):', e.message);
      }
    }

    // ── 3. Create run record ──────────────────────────────────────────────────
    const run = {
      id:             uuidv4(),
      taskId:         task.id,
      status:         'success',
      triggeredBy:    'approve',
      stepsCompleted: 1,
      stepsTotal:     1,
      outputSummary:  `"${task.name || task.title || task.id}" görevi onaylandı ve aktifleştirildi.`,
      webhookFired,
      ...(webhookError ? { webhookError } : {}),
      createdAt:  now,
      updatedAt:  now,
    };
    db.runs.push(run);

    // ── 4. Persist ────────────────────────────────────────────────────────────
    writeDB(db);

    return res.status(200).json({ success: true, task, run });
  } catch (err) {
    console.error('[TasksController.approveTask]', err.message);
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/test-task/:id
//
// Reads the task from db.json and validates its fields to determine
// pass/fail for each of the 4 safety checks, then returns a test report.
// ─────────────────────────────────────────────────────────────────────────────
const testTask = (req, res) => {
  try {
    const { tasks } = readDB();
    const task = tasks.find((t) => t.id === req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found.' });
    }

    // ── Check 1: Template seçildi ─────────────────────────────────────────────
    // Task must have a trigger with a non-empty type (webhook, schedule, etc.)
    const hasTemplate =
      !!task.trigger &&
      typeof task.trigger.type === 'string' &&
      task.trigger.type.trim() !== '';

    // ── Check 2: Kaynak ve hedef tanımlı ─────────────────────────────────────
    // Task must have at least 2 steps (source + at least one destination)
    const hasSourceAndTarget =
      Array.isArray(task.steps) && task.steps.length >= 2;

    // ── Check 3: Onay mekanizması aktif ──────────────────────────────────────
    // Task must be in the approval flow: waiting_approval or already active
    const approvalStatuses = ['waiting_approval', 'active', 'deployed'];
    const hasApproval =
      typeof task.status === 'string' &&
      approvalStatuses.includes(task.status);

    // ── Check 4: maxAttempts limit tanımlı ───────────────────────────────────
    // Task (or its trigger config) must define a numeric maxAttempts / retries
    const hasMaxAttempts =
      typeof task.maxAttempts === 'number' ||
      typeof task.trigger?.config?.maxAttempts === 'number' ||
      typeof task.trigger?.config?.retries === 'number';

    // ── Build checks array ────────────────────────────────────────────────────
    const checks = [
      {
        name:   'Template seçildi',
        result: hasTemplate ? 'passed' : 'failed',
        detail: hasTemplate
          ? `Trigger tipi: "${task.trigger.type}"`
          : 'task.trigger.type alanı eksik veya boş.',
      },
      {
        name:   'Kaynak ve hedef tanımlı',
        result: hasSourceAndTarget ? 'passed' : 'failed',
        detail: hasSourceAndTarget
          ? `${task.steps.length} adım tanımlı (kaynak + hedef mevcut).`
          : 'En az 2 adım (kaynak + hedef) gereklidir.',
      },
      {
        name:   'Onay mekanizması aktif',
        result: hasApproval ? 'passed' : 'failed',
        detail: hasApproval
          ? `Görev durumu: "${task.status}" — onay akışında.`
          : `Görev durumu "${task.status}" onay akışında değil.`,
      },
      {
        name:   'maxAttempts limit tanımlı',
        result: hasMaxAttempts ? 'passed' : 'failed',
        detail: hasMaxAttempts
          ? 'maxAttempts veya retries limiti mevcut.'
          : 'task.maxAttempts veya trigger.config.maxAttempts tanımlı değil.',
      },
    ];

    // ── Determine overall status ──────────────────────────────────────────────
    const allPassed  = checks.every((c) => c.result === 'passed');
    const failedList = checks.filter((c) => c.result === 'failed').map((c) => c.name);

    const overallStatus = allPassed ? 'passed' : 'failed';

    const aiFeedback = allPassed
      ? 'Görev güvenli şekilde aktifleştirilebilir.'
      : `Görev aktifleştirilmeden önce şu kontroller düzeltilmeli: ${failedList.join(', ')}.`;

    return res.status(200).json({
      success: true,
      taskId:  task.id,
      status:  overallStatus,
      checks,
      aiFeedback,
    });
  } catch (err) {
    console.error('[TasksController.testTask]', err.message);
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, approveTask, testTask };
