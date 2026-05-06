const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../utils/db');

// Valid run status values — used for validation on create / update.
const VALID_STATUSES = ['pending', 'running', 'success', 'failed', 'cancelled'];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/runs
// Returns every run stored in db.json, newest first.
// ─────────────────────────────────────────────────────────────────────────────
const getAllRuns = (req, res) => {
  try {
    const { runs } = readDB();

    // Sort newest → oldest so the dashboard shows the latest run at the top.
    const sorted = [...runs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      count: sorted.length,
      data: sorted,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/runs/:id
// ─────────────────────────────────────────────────────────────────────────────
const getRunById = (req, res) => {
  try {
    const { runs } = readDB();
    const run = runs.find((r) => r.id === req.params.id);

    if (!run) {
      return res.status(404).json({ success: false, error: 'Run not found.' });
    }

    res.status(200).json({ success: true, data: run });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/runs
// Body: { taskId: string, status?: string, summary?: string, [extra fields] }
//
// Accepts calls from both internal code and n8n webhooks.
// n8n sends { taskId, status, summary } — all three are handled explicitly.
//
// Automatically adds:
//   id            — uuid v4
//   createdAt     — ISO timestamp at the moment of creation
//   updatedAt     — same as createdAt initially
//   status        — defaults to "pending" if not supplied
//   outputSummary — mapped from `summary` when provided
//   source        — 'n8n' when the call carries a summary field (n8n pattern)
// ─────────────────────────────────────────────────────────────────────────────
const createRun = (req, res) => {
  // Destructure known n8n fields explicitly so they can be normalised.
  const { taskId, status, summary, triggeredBy, ...rest } = req.body;

  // taskId is required — a run must belong to a task.
  if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
    return res.status(400).json({
      success: false,
      error: '`taskId` is required and must be a non-empty string.',
    });
  }

  // Validate status if provided.
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `\`status\` must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  try {
    const db = readDB();

    // ── Task-exists check ────────────────────────────────────────────────────
    // For internal calls the task must already exist.
    // For n8n webhook calls the task might have been created externally, so we
    // emit a warning but do NOT block the run — this keeps the callback
    // endpoint non-fatal for n8n.
    const taskExists = db.tasks.some((t) => t.id === taskId.trim());
    const isN8nCall  = typeof summary === 'string'; // n8n always sends summary

    if (!taskExists) {
      if (isN8nCall) {
        // Non-fatal for n8n: log the orphaned run and continue.
        console.warn(
          `[RunsController.createRun] n8n callback for unknown taskId "${taskId.trim()}" — run will be saved as orphaned.`
        );
      } else {
        return res.status(404).json({
          success: false,
          error: `Task with id "${taskId.trim()}" not found.`,
        });
      }
    }

    const now = new Date().toISOString();

    const run = {
      id:        uuidv4(),
      taskId:    taskId.trim(),
      status:    status ?? 'pending',
      // Normalise: `summary` (n8n field name) → `outputSummary` (internal schema)
      ...(summary          ? { outputSummary: summary }      : {}),
      // Preserve triggeredBy from caller; fall back to 'n8n' when it's an n8n call
      triggeredBy:          triggeredBy ?? (isN8nCall ? 'n8n' : 'manual'),
      // Tag the origin so dashboards can distinguish n8n callbacks from API calls
      source:               isN8nCall ? 'n8n' : 'api',
      createdAt:  now,
      updatedAt:  now,
      // Forward any remaining extra fields (execution id, logs, metadata…)
      ...rest,
    };

    db.runs.push(run);
    writeDB(db);

    // Return `runId` at the top level (as n8n expects) AND `data` for internal clients.
    res.status(201).json({ success: true, runId: run.id, data: run });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/runs/:id
// ─────────────────────────────────────────────────────────────────────────────
const deleteRun = (req, res) => {
  try {
    const db    = readDB();
    const index = db.runs.findIndex((r) => r.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Run not found.' });
    }

    const [removed] = db.runs.splice(index, 1);
    writeDB(db);
    res.status(200).json({ success: true, data: removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllRuns, getRunById, createRun, deleteRun };
