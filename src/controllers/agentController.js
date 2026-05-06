/**
 * src/controllers/agentController.js
 *
 * POST /api/agent/evaluate-event
 *
 * Receives an event from n8n (Telegram / Mail / Slack),
 * compares it against active tasks using Claude, and returns
 * a structured match result with a recommended action.
 */

const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');
const fs   = require('fs');
const path = require('path');
const { readDB, writeDB } = require('../utils/db');

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

// ─── Load event-evaluator system prompt (cached) ─────────────────────────────
let _systemPrompt = null;
const getSystemPrompt = () => {
  if (!_systemPrompt) {
    const p = path.join(__dirname, '../prompts/event-evaluator.md');
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
// POST /api/agent/evaluate-event
//
// Body (Event JSON from n8n):
// {
//   "platform": "telegram" | "email" | "slack",
//   "sender": "username or email",
//   "text": "message content",
//   "metadata": { ... }
// }
// ─────────────────────────────────────────────────────────────────────────────
const evaluateEvent = async (req, res) => {
  const event = req.body;

  // ── Validate incoming event ────────────────────────────────────────────────
  if (!event || !event.platform || !event.text) {
    return res.status(400).json({
      success: false,
      error: '`platform` and `text` are required fields in the event payload.',
    });
  }

  try {
    // ── 1. Fetch active tasks from db ──────────────────────────────────────
    const db = readDB();
    const activeTasks = db.tasks.filter((t) => t.status === 'active');

    if (activeTasks.length === 0) {
      return res.status(200).json({
        success: true,
        matched: false,
        taskId: null,
        confidence: 0.0,
        reason: 'Sistemde aktif görev bulunmuyor.',
        needsApproval: false,
        action: null,
      });
    }

    // ── 2. Build the user prompt for Claude ────────────────────────────────
    const tasksForLLM = activeTasks.map((t) => ({
      id:          t.id,
      name:        t.name,
      description: t.description,
      trigger:     t.trigger,
      steps:       t.steps,
      tags:        t.tags,
    }));

    const userPrompt = JSON.stringify({
      activeTasks: tasksForLLM,
      incomingEvent: event,
    }, null, 2);

    // ── 3. Call Claude ─────────────────────────────────────────────────────
    const client = getClient();
    const model  = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: getSystemPrompt(),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');

    let result;
    try {
      result = JSON.parse(stripFences(rawText));
    } catch {
      const err = new Error('Claude did not return valid JSON for event evaluation.');
      err.status = 502;
      err.rawOutput = rawText;
      throw err;
    }

    // ── 4. Log the evaluation as a run ─────────────────────────────────────
    const now = new Date().toISOString();
    const run = {
      id:             uuidv4(),
      taskId:         result.taskId ?? null,
      status:         result.matched ? 'success' : 'no_match',
      triggeredBy:    'n8n',
      source:         'n8n',
      platform:       event.platform,
      confidence:     result.confidence,
      actionPlatform: result.action?.platform ?? null,
      outputSummary:  result.reason,
      eventPayload:   event,
      evaluationResult: result,
      createdAt:      now,
      updatedAt:      now,
    };
    db.runs.push(run);
    writeDB(db);

    // ── 5. Return result ───────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      runId: run.id,
      ...result,
    });
  } catch (err) {
    console.error('[AgentController.evaluateEvent]', err.message);

    if (err.rawOutput !== undefined) {
      return res.status(502).json({
        success: false,
        error: 'Claude returned an unexpected response format.',
        ...(process.env.NODE_ENV !== 'production' && { raw: err.rawOutput }),
      });
    }

    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
    });
  }
};

module.exports = { evaluateEvent };
