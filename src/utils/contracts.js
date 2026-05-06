const { v4: uuidv4 } = require('uuid');

const PLATFORMS = ['telegram', 'discord', 'mail'];
const SOURCE_PLATFORMS = [...PLATFORMS, 'any'];
const ACTION_PLATFORMS = [...PLATFORMS, 'dashboard'];
const EVENT_TYPES = ['message.created', 'email.received', 'manual.test'];
const DIRECTIONS = ['inbound', 'outbound'];
const TRIGGER_TYPES = ['instant', 'scheduled', 'triggered'];
const CATEGORIES = ['Destek', 'Mail', 'IK', 'Odeme', 'Reklam', 'Diger'];
const ACTION_TYPES = ['send_message', 'send_email', 'summarize', 'create_reminder', 'log_to_dashboard'];
const TASK_STATUSES = ['draft', 'waiting_approval', 'active', 'paused', 'failed'];
const RUN_STATUSES = ['success', 'failed', 'skipped', 'waiting_approval'];
const RUN_PLATFORMS = [...PLATFORMS, 'system'];

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const cleanString = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const toIsoString = (value = null) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const normalizePlatform = (value, { allowAny = false, allowDashboard = false, allowSystem = false } = {}) => {
  const raw = String(value || '').trim().toLowerCase();
  const aliases = {
    email: 'mail',
    gmail: 'mail',
    eposta: 'mail',
    'e-posta': 'mail',
    telegram: 'telegram',
    discord: 'discord',
    dashboard: 'dashboard',
    system: 'system',
    any: 'any',
  };
  const normalized = aliases[raw] || raw;

  const allowed = [
    ...PLATFORMS,
    ...(allowAny ? ['any'] : []),
    ...(allowDashboard ? ['dashboard'] : []),
    ...(allowSystem ? ['system'] : []),
  ];

  return allowed.includes(normalized) ? normalized : null;
};

const normalizeTriggerType = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (TRIGGER_TYPES.includes(raw)) return raw;
  if (['webhook', 'message', 'event'].includes(raw)) return 'triggered';
  if (['cron', 'schedule'].includes(raw)) return 'scheduled';
  return 'triggered';
};

const normalizeCategory = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  const aliases = {
    destek: 'Destek',
    support: 'Destek',
    complaint: 'Destek',
    mail: 'Mail',
    email: 'Mail',
    ik: 'IK',
    hr: 'IK',
    insan: 'IK',
    odeme: 'Odeme',
    'ödeme': 'Odeme',
    finance: 'Odeme',
    reklam: 'Reklam',
    ads: 'Reklam',
    marketing: 'Reklam',
    diger: 'Diger',
    'diğer': 'Diger',
    other: 'Diger',
  };
  return aliases[raw] || (CATEGORIES.includes(value) ? value : 'Diger');
};

const normalizeActionType = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (ACTION_TYPES.includes(raw)) return raw;
  if (['message', 'send', 'notify'].includes(raw)) return 'send_message';
  if (['email', 'mail'].includes(raw)) return 'send_email';
  if (['summary'].includes(raw)) return 'summarize';
  return 'log_to_dashboard';
};

const normalizeAction = (action = {}, fallback = {}) => {
  const input = isObject(action) ? action : {};
  const type = normalizeActionType(input.type || fallback.type);
  const platform =
    normalizePlatform(input.platform || fallback.platform, { allowDashboard: true }) ||
    (type === 'send_email' ? 'mail' : 'dashboard');

  return {
    type,
    platform,
    target: cleanString(input.target, fallback.target || platform),
    textTemplate: cleanString(input.textTemplate || input.text, fallback.textTemplate || '{{text}}'),
  };
};

const validateNormalizedEvent = (payload) => {
  const input = isObject(payload?.event) ? payload.event : payload;
  const errors = [];

  if (!isObject(input)) {
    return { valid: false, errors: ['event must be an object'], event: null };
  }

  const platform = normalizePlatform(input.platform);
  if (!platform) errors.push('event.platform must be telegram, discord, or mail');

  const eventType = cleanString(input.eventType);
  if (!EVENT_TYPES.includes(eventType)) errors.push(`event.eventType must be one of: ${EVENT_TYPES.join(', ')}`);

  const direction = cleanString(input.direction);
  if (!DIRECTIONS.includes(direction)) errors.push(`event.direction must be one of: ${DIRECTIONS.join(', ')}`);

  const text = typeof input.text === 'string' ? input.text : '';
  const subject = input.subject === null || input.subject === undefined ? null : cleanString(input.subject, null);
  if (!text.trim() && !subject) errors.push('event.text or event.subject is required');

  const event = {
    eventId: cleanString(input.eventId),
    platform,
    eventType,
    direction,
    conversationId: cleanString(input.conversationId),
    senderId: cleanString(input.senderId),
    senderName: cleanString(input.senderName),
    text,
    subject,
    timestamp: toIsoString(input.timestamp),
    raw: isObject(input.raw) ? input.raw : {},
  };

  for (const field of ['eventId', 'conversationId', 'senderId', 'senderName']) {
    if (!event[field]) errors.push(`event.${field} is required`);
  }

  return { valid: errors.length === 0, errors, event };
};

const normalizeTask = (input = {}, now = new Date().toISOString()) => {
  const sourcePlatform =
    normalizePlatform(input.sourcePlatform || input.source, { allowAny: true }) || 'any';
  const action = normalizeAction(input.action, {
    platform: normalizePlatform(input.target, { allowDashboard: true }) || 'dashboard',
    target: input.target || 'dashboard',
  });
  const missingFields = Array.isArray(input.missingFields)
    ? input.missingFields.map((field) => cleanString(field)).filter(Boolean)
    : [];

  return {
    id: cleanString(input.id, `task_${uuidv4()}`),
    title: cleanString(input.title || input.name, 'Yeni otomasyon gorevi'),
    description: cleanString(input.description, cleanString(input.condition, 'Dogal dil ile olusturulan otomasyon gorevi.')),
    sourcePlatform,
    triggerType: normalizeTriggerType(input.triggerType || input.trigger?.type),
    condition: cleanString(input.condition, input.description || 'Event aktif gorev kosuluyla anlamsal olarak eslesir.'),
    category: normalizeCategory(input.category),
    action,
    approvalRequired: input.approvalRequired !== undefined ? Boolean(input.approvalRequired) : true,
    status: TASK_STATUSES.includes(input.status) ? input.status : missingFields.length > 0 ? 'draft' : 'waiting_approval',
    maxAttempts: Number.isInteger(input.maxAttempts) ? input.maxAttempts : 3,
    missingFields,
    createdAt: toIsoString(input.createdAt || now),
    updatedAt: toIsoString(input.updatedAt || now),
  };
};

const validateTask = (task) => {
  const normalized = normalizeTask(task);
  const errors = [];
  if (!SOURCE_PLATFORMS.includes(normalized.sourcePlatform)) errors.push('sourcePlatform is invalid');
  if (!TRIGGER_TYPES.includes(normalized.triggerType)) errors.push('triggerType is invalid');
  if (!CATEGORIES.includes(normalized.category)) errors.push('category is invalid');
  if (!ACTION_TYPES.includes(normalized.action.type)) errors.push('action.type is invalid');
  if (!ACTION_PLATFORMS.includes(normalized.action.platform)) errors.push('action.platform is invalid');
  if (!TASK_STATUSES.includes(normalized.status)) errors.push('status is invalid');
  if (!Number.isInteger(normalized.maxAttempts) || normalized.maxAttempts < 1) errors.push('maxAttempts must be positive');
  return { valid: errors.length === 0, errors, task: normalized };
};

const normalizeDecision = (input = {}) => {
  const matched = Boolean(input.matched);
  const confidence = Number.isFinite(Number(input.confidence))
    ? Math.min(1, Math.max(0, Number(input.confidence)))
    : matched ? 0.5 : 0;
  const action = matched && isObject(input.action)
    ? {
        type: normalizeActionType(input.action.type),
        platform: normalizePlatform(input.action.platform, { allowDashboard: true }) || 'dashboard',
        target: cleanString(input.action.target, 'dashboard'),
        text: cleanString(input.action.text, ''),
      }
    : null;

  return {
    matched,
    taskId: matched ? cleanString(input.taskId, null) : null,
    confidence,
    reason: cleanString(input.reason, matched ? 'Event aktif gorevle eslesti.' : 'Event aktif gorevlerle eslesmedi.'),
    needsApproval: Boolean(input.needsApproval),
    action,
  };
};

const createRunLog = (input = {}) => {
  const platform = normalizePlatform(input.platform, { allowSystem: true }) || 'system';
  const actionPlatform = input.actionPlatform
    ? normalizePlatform(input.actionPlatform, { allowDashboard: true })
    : null;

  return {
    id: cleanString(input.id, `run_${uuidv4()}`),
    taskId: input.taskId === undefined ? null : input.taskId,
    eventId: input.eventId === undefined ? null : input.eventId,
    status: RUN_STATUSES.includes(input.status) ? input.status : 'skipped',
    platform,
    actionPlatform,
    confidence: input.confidence === undefined || input.confidence === null ? null : Number(input.confidence),
    summary: cleanString(input.summary, input.reason || 'Run kaydi olusturuldu.'),
    reason: cleanString(input.reason, input.summary || ''),
    createdAt: toIsoString(input.createdAt),
    details: isObject(input.details) ? input.details : {},
  };
};

module.exports = {
  PLATFORMS,
  SOURCE_PLATFORMS,
  ACTION_PLATFORMS,
  EVENT_TYPES,
  DIRECTIONS,
  TRIGGER_TYPES,
  CATEGORIES,
  ACTION_TYPES,
  TASK_STATUSES,
  RUN_STATUSES,
  RUN_PLATFORMS,
  isObject,
  cleanString,
  toIsoString,
  normalizePlatform,
  normalizeTriggerType,
  normalizeCategory,
  normalizeAction,
  validateNormalizedEvent,
  normalizeTask,
  validateTask,
  normalizeDecision,
  createRunLog,
};
