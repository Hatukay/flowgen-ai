const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const mockLlm = require('./mockLlmService');

let client = null;
const promptCache = new Map();

const getClient = () => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
};

const shouldUseMock = () => String(process.env.MOCK_LLM || '').toLowerCase() === 'true';

const getPrompt = (fileName) => {
  if (!promptCache.has(fileName)) {
    const candidates = [
      path.join(process.cwd(), 'prompts', fileName),
      path.join(__dirname, '../prompts', fileName),
    ];
    const promptPath = candidates.find((candidate) => fs.existsSync(candidate));
    if (!promptPath) throw new Error(`Prompt file not found: ${fileName}`);
    promptCache.set(fileName, fs.readFileSync(promptPath, 'utf-8'));
  }
  return promptCache.get(fileName);
};

const stripFences = (text) =>
  String(text || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const parseJsonOrThrow = (rawText, label) => {
  const cleaned = stripFences(rawText);
  try {
    return JSON.parse(cleaned);
  } catch {
    const err = new Error(`${label} did not return valid JSON.`);
    err.rawOutput = cleaned;
    err.status = 502;
    throw err;
  }
};

const generateJson = async ({ systemPrompt, userPrompt, maxOutputTokens = 2048 }) => {
  const response = await getClient().models.generateContent({
    model: process.env.GEMINI_MODEL || process.env.LLM_MODEL || 'gemini-3-flash-preview',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.2,
      maxOutputTokens,
    },
  });

  return response.text || '';
};

const generateTaskPlan = async (message) => {
  if (shouldUseMock()) {
    return mockLlm.buildTaskPlan(message);
  }

  const raw = await generateJson({
    systemPrompt: getPrompt('task-planner.md'),
    userPrompt: JSON.stringify({ message }, null, 2),
    maxOutputTokens: 3072,
  });
  return parseJsonOrThrow(raw, 'Gemini task planner');
};

const evaluateEventDecision = async (event, tasks) => {
  if (shouldUseMock()) {
    return mockLlm.evaluateEvent(event, tasks);
  }

  const raw = await generateJson({
    systemPrompt: getPrompt('event-decision-agent.md'),
    userPrompt: JSON.stringify({ event, activeTasks: tasks }, null, 2),
    maxOutputTokens: 2048,
  });
  return parseJsonOrThrow(raw, 'Gemini event decision agent');
};

const generateWorkflowJson = async (plan) => {
  if (shouldUseMock()) {
    return {
      name: plan?.task?.title || plan?.title || 'AI FlowOps demo workflow',
      active: false,
      nodes: [],
      connections: {},
      meta: { templateCredsSetupCompleted: true, mock: true },
    };
  }

  const raw = await generateJson({
    systemPrompt: getPrompt('workflow-builder.md'),
    userPrompt: JSON.stringify(plan, null, 2),
    maxOutputTokens: 4096,
  });
  return parseJsonOrThrow(raw, 'Gemini workflow builder');
};

module.exports = {
  generateTaskPlan,
  evaluateEventDecision,
  generateWorkflowJson,
  parseJsonOrThrow,
  stripFences,
};
