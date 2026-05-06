const { readDB, writeDB } = require('../utils/db');
const { RUN_STATUSES, createRunLog } = require('../utils/contracts');

const getAllRuns = (req, res) => {
  try {
    const { runs = [] } = readDB();
    const sorted = [...runs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ success: true, count: sorted.length, data: sorted });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getRunById = (req, res) => {
  try {
    const { runs = [] } = readDB();
    const run = runs.find((item) => item.id === req.params.id);
    if (!run) return res.status(404).json({ success: false, error: 'Run not found.' });
    return res.status(200).json({ success: true, data: run });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const createRun = (req, res) => {
  const { status } = req.body;
  if (status && !RUN_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `\`status\` must be one of: ${RUN_STATUSES.join(', ')}.`,
    });
  }

  try {
    const db = readDB();
    const run = createRunLog({
      taskId: req.body.taskId ?? null,
      eventId: req.body.eventId ?? null,
      status: req.body.status || 'success',
      platform: req.body.platform || 'system',
      actionPlatform: req.body.actionPlatform ?? null,
      confidence: req.body.confidence ?? null,
      summary: req.body.summary || req.body.outputSummary || 'n8n run sonucu loglandi.',
      reason: req.body.reason || req.body.summary || '',
      details: req.body.details || {
        source: req.body.source || 'n8n',
        raw: req.body,
      },
    });

    db.runs = Array.isArray(db.runs) ? db.runs : [];
    db.runs.push(run);
    writeDB(db);

    return res.status(201).json({ success: true, runId: run.id, data: run });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const deleteRun = (req, res) => {
  try {
    const db = readDB();
    const index = db.runs.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Run not found.' });

    const [removed] = db.runs.splice(index, 1);
    writeDB(db);
    return res.status(200).json({ success: true, data: removed });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllRuns, getRunById, createRun, deleteRun };
