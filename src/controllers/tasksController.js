const { readDB, writeDB } = require('../utils/db');
const { createRunLog, normalizeTask, validateTask } = require('../utils/contracts');

const getAllTasks = (req, res) => {
  try {
    const { tasks = [] } = readDB();
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getTaskById = (req, res) => {
  try {
    const { tasks = [] } = readDB();
    const task = tasks.find((item) => item.id === req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const createTask = (req, res) => {
  const { task, errors } = validateTask(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: errors.join('; ') });
  }

  try {
    const db = readDB();
    db.tasks = Array.isArray(db.tasks) ? db.tasks : [];
    db.tasks.unshift(task);
    writeDB(db);
    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const updateTask = (req, res) => {
  try {
    const db = readDB();
    const index = db.tasks.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Task not found.' });

    const nextTask = normalizeTask({
      ...db.tasks[index],
      ...req.body,
      id: db.tasks[index].id,
      createdAt: db.tasks[index].createdAt,
      updatedAt: new Date().toISOString(),
    });
    const validation = validateTask(nextTask);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.errors.join('; ') });
    }

    db.tasks[index] = validation.task;
    writeDB(db);
    return res.status(200).json({ success: true, data: validation.task });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const deleteTask = (req, res) => {
  try {
    const db = readDB();
    const index = db.tasks.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Task not found.' });

    const [removed] = db.tasks.splice(index, 1);
    writeDB(db);
    return res.status(200).json({ success: true, data: removed });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

const approveTask = (req, res) => {
  try {
    const db = readDB();
    const index = db.tasks.findIndex((item) => item.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Task not found.' });

    const now = new Date().toISOString();
    const task = normalizeTask({
      ...db.tasks[index],
      status: 'active',
      updatedAt: now,
    });
    db.tasks[index] = task;

    const run = createRunLog({
      taskId: task.id,
      eventId: null,
      status: 'success',
      platform: 'system',
      actionPlatform: task.action.platform,
      confidence: null,
      summary: `"${task.title}" gorevi onaylandi ve aktif edildi.`,
      reason: 'Kullanici onayi ile gorev active durumuna alindi.',
      details: { source: 'approval', task },
      createdAt: now,
    });
    db.runs = Array.isArray(db.runs) ? db.runs : [];
    db.runs.push(run);

    writeDB(db);
    return res.status(200).json({ success: true, task, run, data: task });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

const testTask = (req, res) => {
  try {
    const { tasks = [] } = readDB();
    const task = tasks.find((item) => item.id === req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });

    const validation = validateTask(task);
    const checks = [
      {
        name: 'Task schema dogru',
        result: validation.valid ? 'passed' : 'failed',
        detail: validation.valid ? 'Gerekli alanlar gecerli.' : validation.errors.join('; '),
      },
      {
        name: 'Action var',
        result: task.action?.type && task.action?.platform ? 'passed' : 'failed',
        detail: task.action ? `${task.action.type} -> ${task.action.platform}` : 'action eksik.',
      },
      {
        name: 'Source platform var',
        result: task.sourcePlatform ? 'passed' : 'failed',
        detail: task.sourcePlatform || 'sourcePlatform eksik.',
      },
      {
        name: 'Status active',
        result: task.status === 'active' ? 'passed' : 'failed',
        detail: `Gorev durumu: ${task.status}`,
      },
      {
        name: 'LLM decision test edilebilir',
        result: process.env.GEMINI_API_KEY || process.env.MOCK_LLM === 'true' ? 'passed' : 'failed',
        detail: process.env.MOCK_LLM === 'true' ? 'MOCK_LLM aktif.' : 'Gemini API key env dosyasindan okunabilir.',
      },
    ];

    const status = checks.every((check) => check.result === 'passed') ? 'passed' : 'failed';
    return res.status(200).json({
      success: true,
      taskId: task.id,
      status,
      checks,
      aiFeedback: status === 'passed'
        ? 'Gorev n8n event akisi icin test edilebilir durumda.'
        : 'Gorev aktiflestirilmeden veya demo edilmeden once failed kontroller duzeltilmeli.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  approveTask,
  testTask,
};
