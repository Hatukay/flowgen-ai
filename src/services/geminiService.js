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
    const task = plan?.task || plan || {};
    const src = task.sourcePlatform || 'telegram';
    const dst = task.action?.platform || 'discord';
    const title = task.title || 'AI FlowOps demo workflow';

    const triggerNodeMap = {
      telegram: { type: 'n8n-nodes-base.telegramTrigger', params: { updates: ['message'] }, credKey: 'telegramApi', credName: 'My Telegram Bot' },
      discord:  { type: 'n8n-nodes-base.discordTrigger',  params: { events: ['messageCreate'] }, credKey: 'discordBotApi', credName: 'My Discord Bot' },
      mail:     { type: 'n8n-nodes-base.emailReadImap',   params: { mailbox: 'INBOX', postProcessAction: 'read' }, credKey: 'imap', credName: 'My IMAP Account' },
    };
    const actionNodeMap = {
      telegram: { type: 'n8n-nodes-base.telegram',  params: { operation: 'sendMessage', chatId: '', text: task.action?.textTemplate || '' }, credKey: 'telegramApi', credName: 'My Telegram Bot' },
      discord:  { type: 'n8n-nodes-base.discord',   params: { operation: 'sendMessage', guildId: '', channelId: '', content: task.action?.textTemplate || '' }, credKey: 'discordBotApi', credName: 'My Discord Bot' },
      mail:     { type: 'n8n-nodes-base.gmail',     params: { operation: 'send', to: '', subject: title, message: task.action?.textTemplate || '' }, credKey: 'gmailOAuth2', credName: 'My Gmail' },
      dashboard: { type: 'n8n-nodes-base.httpRequest', params: { method: 'POST', url: 'http://localhost:3001/api/runs', sendBody: true }, credKey: null, credName: null },
    };

    const trigger = triggerNodeMap[src] || triggerNodeMap.telegram;
    const action  = actionNodeMap[dst]  || actionNodeMap.discord;

    const triggerNode = {
      id: `node-trigger-${src}`,
      name: `${src.charAt(0).toUpperCase() + src.slice(1)} Trigger`,
      type: trigger.type,
      typeVersion: 1,
      position: [250, 300],
      parameters: trigger.params,
      ...(trigger.credKey ? { credentials: { [trigger.credKey]: { id: '1', name: trigger.credName } } } : {}),
    };

    const httpNode = {
      id: 'node-backend-event',
      name: 'Backend Event Gonder',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4,
      position: [500, 300],
      parameters: {
        method: 'POST',
        url: 'http://localhost:3001/api/agent/evaluate-event',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={ "event": { "eventId": "{{ $json.message?.message_id || $json.id || 'evt_' + Date.now() }}", "platform": "${src}", "eventType": "message.created", "direction": "inbound", "conversationId": "{{ $json.message?.chat?.id || $json.channel_id || '' }}", "senderId": "{{ $json.message?.from?.id || $json.author?.id || '' }}", "senderName": "{{ $json.message?.from?.first_name || $json.author?.username || 'Unknown' }}", "text": "{{ $json.message?.text || $json.content || '' }}", "subject": null, "timestamp": "{{ new Date().toISOString() }}", "raw": {} } }`,
      },
    };

    const actionNode = {
      id: `node-action-${dst}`,
      name: `${dst.charAt(0).toUpperCase() + dst.slice(1)} Aksiyon`,
      type: action.type,
      typeVersion: dst === 'dashboard' ? 4 : 2,
      position: [750, 300],
      parameters: action.params,
      ...(action.credKey ? { credentials: { [action.credKey]: { id: '2', name: action.credName } } } : {}),
    };

    return {
      name: title,
      active: false,
      nodes: [triggerNode, httpNode, actionNode],
      connections: {
        [triggerNode.name]: { main: [[{ node: httpNode.name, type: 'main', index: 0 }]] },
        [httpNode.name]:    { main: [[{ node: actionNode.name, type: 'main', index: 0 }]] },
      },
      settings: { executionOrder: 'v1' },
      meta: { templateCredsSetupCompleted: false, mock: true },
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
