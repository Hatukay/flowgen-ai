const assert = require('assert');
const {
  normalizeDecision,
  normalizeTask,
  validateNormalizedEvent,
  validateTask,
} = require('../src/utils/contracts');

const eventPayload = {
  event: {
    eventId: 'telegram_test_1',
    platform: 'telegram',
    eventType: 'message.created',
    direction: 'inbound',
    conversationId: 'chat_1',
    senderId: 'user_1',
    senderName: 'Demo User',
    text: 'Kargom gelmedi, destek istiyorum.',
    subject: null,
    timestamp: '2026-05-06T13:00:00Z',
    raw: {},
  },
};

const eventValidation = validateNormalizedEvent(eventPayload);
assert.equal(eventValidation.valid, true);
assert.equal(eventValidation.event.platform, 'telegram');

const invalidEvent = validateNormalizedEvent({ event: { platform: 'slack', text: '' } });
assert.equal(invalidEvent.valid, false);

const task = normalizeTask({
  title: 'Telegram destek mesajlarini Discorda gonder',
  sourcePlatform: 'telegram',
  triggerType: 'triggered',
  condition: 'Destek talebi anlami varsa eslesir.',
  category: 'Destek',
  action: {
    type: 'send_message',
    platform: 'discord',
    target: '#destek',
    textTemplate: 'Mesaj: {{text}}',
  },
  status: 'active',
});
const taskValidation = validateTask(task);
assert.equal(taskValidation.valid, true);
assert.equal(taskValidation.task.action.platform, 'discord');

const decision = normalizeDecision({
  matched: true,
  taskId: task.id,
  confidence: 2,
  action: { type: 'send_message', platform: 'discord', target: '#destek', text: 'ok' },
});
assert.equal(decision.confidence, 1);
assert.equal(decision.action.platform, 'discord');

console.log('contracts.test.js passed');
