const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// ─── Singleton client ─────────────────────────────────────────────────────────
let _client = null;
const getClient = () => {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables.');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
};

// ─── System prompts (loaded once per file, cached in memory) ─────────────────
const _promptCache = new Map();
const getSystemPrompt = (promptFile = 'task-planner.md') => {
  if (!_promptCache.has(promptFile)) {
    const promptPath = path.join(__dirname, '../prompts', promptFile);
    _promptCache.set(promptFile, fs.readFileSync(promptPath, 'utf-8'));
  }
  return _promptCache.get(promptFile);
};

/**
 * Calls Claude with the task-planner system prompt and the user's message.
 * Attempts to parse Claude's response as JSON; throws if the model returns
 * something that isn't valid JSON.
 *
 * @param {string} userMessage  - The raw task description from the user.
 * @param {object} [options]    - Optional overrides.
 * @param {string} [options.model]       - Claude model identifier.
 * @param {number} [options.maxTokens]   - Max output tokens.
 * @returns {Promise<object>}   - Parsed JSON plan from Claude.
 */
const generateTaskPlan = async (userMessage, options = {}) => {
  const client = getClient();
  const systemPrompt = getSystemPrompt();

  const model = options.model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
  const maxTokens = options.maxTokens || 2048;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Claude returns an array of content blocks; grab the first text block.
  const rawText = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Strip accidental markdown fences if the model adds them despite instructions.
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let plan;
  try {
    plan = JSON.parse(cleaned);
  } catch {
    // Surface the raw output so the caller can log / return a useful error.
    const err = new Error('Claude did not return valid JSON.');
    err.rawOutput = cleaned;
    err.status = 502;
    throw err;
  }

  return plan;
};

module.exports = { generateTaskPlan };
