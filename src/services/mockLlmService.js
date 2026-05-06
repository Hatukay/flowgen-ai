const { normalizeDecision, normalizeTask } = require('../utils/contracts');

const buildTaskPlan = (message) => {
  const lower = String(message || '').toLocaleLowerCase('tr-TR');
  const now = new Date().toISOString();

  if (lower.match(/mail|e-?posta|gmail/) && lower.match(/ozet|özet|son 10/)) {
    const task = normalizeTask({
      id: `task_mail_${Date.now()}`,
      title: 'Son 10 maili ozetle',
      description: 'Mail kutusundaki son 10 mesaji ozetleyip dashboarda kaydeder.',
      sourcePlatform: 'mail',
      triggerType: 'instant',
      condition: 'Kullanici mail ozetini manuel olarak ister.',
      category: 'Mail',
      action: {
        type: 'summarize',
        platform: 'dashboard',
        target: 'dashboard',
        textTemplate: 'Son mail ozeti: {{summary}}',
      },
      approvalRequired: true,
      status: 'waiting_approval',
      createdAt: now,
      updatedAt: now,
    });

    return {
      type: 'task_plan',
      task,
      plan: [
        'Mail connector son mesajlari n8n ile alir.',
        'Backend AI planner ozetleme gorevini kaydeder.',
        'Sonuc dashboard run loguna yazilir.',
      ],
      missingFields: [],
    };
  }

  if (lower.match(/odeme|ödeme|hatirlat|hatırlat|fatura/)) {
    const task = normalizeTask({
      id: `task_payment_${Date.now()}`,
      title: 'Odeme tarihi yaklasan mailleri hatirlat',
      description: 'Mail eventlerinde odeme tarihi bilgisini bulup hatirlatma aksiyonu olusturur.',
      sourcePlatform: 'mail',
      triggerType: 'triggered',
      condition: 'Mail icerigi odeme tarihi veya fatura hatirlatmasi anlamina geliyorsa eslesir.',
      category: 'Odeme',
      action: {
        type: 'create_reminder',
        platform: 'dashboard',
        target: 'reminders',
        textTemplate: 'Odeme hatirlatmasi: {{subject}} {{text}}',
      },
      approvalRequired: true,
      status: 'waiting_approval',
      createdAt: now,
      updatedAt: now,
    });

    return {
      type: 'task_plan',
      task,
      plan: [
        'Mail eventleri ortak Event JSON formatina cevrilir.',
        'AI decision agent odeme tarihi anlamini kontrol eder.',
        'Eslesirse dashboarda hatirlatma kaydi loglanir.',
      ],
      missingFields: [],
    };
  }

  const task = normalizeTask({
    id: `task_telegram_discord_${Date.now()}`,
    title: 'Telegram destek mesajlarini Discorda gonder',
    description: 'Telegramdan gelen destek veya sikayet mesajlarini Discord destek kanalina iletir.',
    sourcePlatform: 'telegram',
    triggerType: 'triggered',
    condition: 'Telegramdan gelen mesaj destek talebi veya sikayet anlami tasiyorsa eslesir.',
    category: 'Destek',
    action: {
      type: 'send_message',
      platform: 'discord',
      target: '#destek',
      textTemplate: 'Yeni Telegram destek mesaji:\nKullanici: {{senderName}}\nMesaj: {{text}}',
    },
    approvalRequired: true,
    status: 'waiting_approval',
    createdAt: now,
    updatedAt: now,
  });

  return {
    type: 'task_plan',
    task,
    plan: [
      'Telegram mesajlari n8n tarafindan alinir.',
      'Mesaj ortak Event JSON formatina cevrilir.',
      'Backend AI agent aktif gorevlerle anlamsal eslestirme yapar.',
      'Eslesirse Discord destek kanalina mesaj aksiyonu dondurulur.',
      'n8n sonucu /api/runs endpointine loglar.',
    ],
    missingFields: [],
  };
};

const renderTemplate = (template, event) =>
  String(template || '')
    .replaceAll('{{senderName}}', event.senderName || '')
    .replaceAll('{{text}}', event.text || '')
    .replaceAll('{{subject}}', event.subject || '');

const evaluateEvent = (event, tasks) => {
  const candidates = tasks.filter(
    (task) => task.status === 'active' && (task.sourcePlatform === 'any' || task.sourcePlatform === event.platform)
  );

  if (candidates.length === 0) {
    return normalizeDecision({
      matched: false,
      reason: 'Demo fallback aktif: event platformuna uygun aktif gorev bulunamadi.',
    });
  }

  const task = candidates[0];
  return normalizeDecision({
    matched: true,
    taskId: task.id,
    confidence: 0.82,
    reason: 'Demo fallback aktif: event platformu aktif gorevin kaynak platformuyla uyumlu.',
    needsApproval: false,
    action: {
      type: task.action.type,
      platform: task.action.platform,
      target: task.action.target,
      text: renderTemplate(task.action.textTemplate, event),
    },
  });
};

module.exports = { buildTaskPlan, evaluateEvent };
