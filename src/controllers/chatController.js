const { v4: uuidv4 } = require('uuid');
const { generateTaskPlan } = require('../services/geminiService');
const { readDB, writeDB } = require('../utils/db');
const { normalizeTask } = require('../utils/contracts');

const chat = async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: '`message` is required and must be a non-empty string.',
    });
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return res.status(400).json({ success: false, error: '`message` must not be blank.' });
  }

  if (trimmed.length > 2000) {
    return res.status(400).json({
      success: false,
      error: '`message` must be 2000 characters or fewer.',
    });
  }

  try {
    const rawPlan = await generateTaskPlan(trimmed);
    const missingFields = Array.isArray(rawPlan.missingFields) ? rawPlan.missingFields : [];
    const now = new Date().toISOString();
    const task = normalizeTask({
      ...(rawPlan.task || rawPlan),
      id: rawPlan.task?.id || rawPlan.id || `task_${uuidv4()}`,
      status: missingFields.length > 0 ? 'draft' : 'waiting_approval',
      missingFields,
      createdAt: now,
      updatedAt: now,
    }, now);

    const response = {
      type: 'task_plan',
      task,
      plan: Array.isArray(rawPlan.plan) && rawPlan.plan.length > 0
        ? rawPlan.plan
        : [
            'n8n event verisini ortak formata cevirir.',
            'Backend AI agent aktif gorevlerle eslestirme yapar.',
            'Sonuc dashboarda run log olarak yazilir.',
          ],
      missingFields,
    };

    const db = readDB();
    db.tasks = Array.isArray(db.tasks) ? db.tasks : [];
    db.tasks.unshift(task);
    writeDB(db);

    return res.status(200).json({ success: true, ...response });
  } catch (err) {
    console.error('[ChatController] Gemini error:', err.message);

    if (err.rawOutput !== undefined) {
      return res.status(502).json({
        success: false,
        error: 'Gemini returned an unexpected response format.',
        ...(process.env.NODE_ENV !== 'production' && { raw: err.rawOutput }),
      });
    }

    if (err.status === 401 || err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({
        success: false,
        error: 'Server misconfiguration: missing or invalid Gemini API key.',
      });
    }

    if (err.status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Gemini rate limit reached. Please wait a moment and try again.',
      });
    }

    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

module.exports = { chat };
