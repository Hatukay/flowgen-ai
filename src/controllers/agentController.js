const { evaluateEventDecision } = require('../services/geminiService');
const { readDB, writeDB } = require('../utils/db');
const {
  createRunLog,
  normalizeDecision,
  validateNormalizedEvent,
} = require('../utils/contracts');

const skippedDecision = (reason) => ({
  matched: false,
  taskId: null,
  confidence: 0,
  reason,
  needsApproval: false,
  action: null,
});

const renderActionText = (decision, event) => {
  if (!decision.action || decision.action.text) return decision;

  const text = String(decision.action.textTemplate || '')
    .replaceAll('{{senderName}}', event.senderName || '')
    .replaceAll('{{text}}', event.text || '')
    .replaceAll('{{subject}}', event.subject || '');

  return {
    ...decision,
    action: {
      ...decision.action,
      text,
    },
  };
};

const evaluateEvent = async (req, res) => {
  try {
    const validation = validateNormalizedEvent(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; '),
      });
    }

    const { event } = validation;
    const db = readDB();
    const activeTasks = (db.tasks || []).filter((task) => task.status === 'active');

    let decision;
    let llmError = null;

    if (activeTasks.length === 0) {
      decision = skippedDecision('Sistemde aktif gorev bulunmuyor.');
    } else {
      try {
        decision = await evaluateEventDecision(event, activeTasks);
      } catch (err) {
        llmError = err;
        if (err.rawOutput !== undefined) {
          decision = skippedDecision('LLM gecerli JSON dondurmedi; event guvenli sekilde atlandi.');
        } else {
          throw err;
        }
      }
    }

    const parsedDecision = normalizeDecision(decision);
    const taskExists = parsedDecision.taskId
      ? activeTasks.some((task) => task.id === parsedDecision.taskId)
      : false;
    const normalizedDecision = renderActionText(
      parsedDecision.matched && !taskExists
        ? normalizeDecision({
            matched: false,
            reason: 'LLM gecersiz taskId dondurdu; event guvenli sekilde atlandi.',
          })
        : parsedDecision,
      event
    );
    const run = createRunLog({
      taskId: normalizedDecision.taskId,
      eventId: event.eventId,
      status: normalizedDecision.matched
        ? normalizedDecision.needsApproval ? 'waiting_approval' : 'success'
        : 'skipped',
      platform: event.platform,
      actionPlatform: normalizedDecision.action?.platform ?? null,
      confidence: normalizedDecision.confidence,
      summary: normalizedDecision.matched
        ? `Event ${normalizedDecision.taskId} goreviyle eslesti.`
        : 'Event aktif gorevlerle eslesmedi.',
      reason: normalizedDecision.reason,
      details: {
        event,
        decision: normalizedDecision,
        ...(llmError?.rawOutput ? { rawLlmOutput: llmError.rawOutput } : {}),
      },
    });

    db.runs = Array.isArray(db.runs) ? db.runs : [];
    db.runs.push(run);
    writeDB(db);

    return res.status(200).json({
      success: true,
      runId: run.id,
      ...normalizedDecision,
    });
  } catch (err) {
    console.error('[AgentController.evaluateEvent]', err.message);
    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

module.exports = { evaluateEvent };
