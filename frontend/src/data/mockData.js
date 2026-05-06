export const demoPrompts = [
  "Telegram sikayetlerini Discord destek kanalina gonder",
  "Son 10 maili ozetle",
  "Odeme tarihi yaklasan maili bul ve hatirlat",
];

export const mockTasks = [
  {
    id: "task_demo_telegram_discord_support",
    title: "Telegram destek mesajlarini Discorda gonder",
    description: "Telegramdan gelen destek veya sikayet mesajlarini Discord destek kanalina iletir.",
    category: "Destek",
    triggerType: "triggered",
    sourcePlatform: "telegram",
    condition: "Telegramdan gelen mesaj destek talebi veya sikayet anlami tasiyorsa eslesir.",
    action: {
      type: "send_message",
      platform: "discord",
      target: "#destek",
      textTemplate: "Yeni Telegram destek mesaji: {{text}}",
    },
    approvalRequired: true,
    status: "active",
    maxAttempts: 3,
    createdAt: "2026-05-06T10:00:00Z",
  },
  {
    id: "task_demo_mail_summary",
    title: "Son 10 maili ozetle",
    description: "Mail kutusundaki son mesajlari ozetleyip dashboarda kaydeder.",
    category: "Mail",
    triggerType: "instant",
    sourcePlatform: "mail",
    condition: "Kullanici mail ozetini manuel olarak ister.",
    action: {
      type: "summarize",
      platform: "dashboard",
      target: "dashboard",
      textTemplate: "Mail ozeti: {{summary}}",
    },
    approvalRequired: true,
    status: "active",
    maxAttempts: 3,
    createdAt: "2026-05-06T10:15:00Z",
  },
  {
    id: "task_demo_payment_reminder",
    title: "Odeme tarihi yaklasan mailleri hatirlat",
    description: "Mail eventlerinde odeme tarihi bilgisini bulup hatirlatma aksiyonu olusturur.",
    category: "Odeme",
    triggerType: "triggered",
    sourcePlatform: "mail",
    condition: "Mail icerigi odeme tarihi veya fatura hatirlatmasi anlamina geliyorsa eslesir.",
    action: {
      type: "create_reminder",
      platform: "dashboard",
      target: "reminders",
      textTemplate: "Odeme hatirlatmasi: {{subject}} {{text}}",
    },
    approvalRequired: true,
    status: "active",
    maxAttempts: 3,
    createdAt: "2026-05-06T10:30:00Z",
  },
];

export const mockRuns = [
  {
    id: "run_demo_telegram_discord_1",
    taskId: "task_demo_telegram_discord_support",
    eventId: "telegram_demo_1",
    status: "success",
    platform: "telegram",
    actionPlatform: "discord",
    confidence: 0.91,
    summary: "Telegram destek mesaji Discord aksiyonuna donustu.",
    reason: "Mesaj teslimat problemi ve destek talebi anlami tasiyor.",
    createdAt: "2026-05-06T13:00:00Z",
  },
  {
    id: "run_demo_mail_summary_1",
    taskId: "task_demo_mail_summary",
    eventId: "mail_demo_1",
    status: "success",
    platform: "mail",
    actionPlatform: "dashboard",
    confidence: 0.86,
    summary: "Mail ozeti dashboarda kaydedildi.",
    reason: "Event mail ozetleme goreviyle eslesti.",
    createdAt: "2026-05-06T13:20:00Z",
  },
  {
    id: "run_demo_discord_skipped_1",
    taskId: null,
    eventId: "discord_demo_1",
    status: "skipped",
    platform: "discord",
    actionPlatform: null,
    confidence: 0,
    summary: "Discord event aktif gorevlerle eslesmedi.",
    reason: "Demo seed icinde Discord kaynakli aktif gorev yok.",
    createdAt: "2026-05-06T13:30:00Z",
  },
];

export const mockTestResult = {
  status: "passed",
  checks: [
    { name: "Task schema dogru", result: "passed" },
    { name: "Action var", result: "passed" },
    { name: "Source platform var", result: "passed" },
    { name: "Onay mekanizmasi aktif", result: "passed" },
    { name: "LLM decision test edilebilir", result: "passed" },
  ],
  aiFeedback: "Gorev n8n event akisi icin test edilebilir durumda.",
};

export const defaultPlan = {
  type: "task_plan",
  task: {
    id: "task_demo_telegram_discord_pending",
    title: "Telegram destek mesajlarini Discorda gonder",
    description: "Telegramdan gelen destek veya sikayet mesajlarini Discord destek kanalina iletir.",
    category: "Destek",
    triggerType: "triggered",
    sourcePlatform: "telegram",
    condition: "Telegramdan gelen mesaj destek talebi veya sikayet anlami tasiyorsa eslesir.",
    action: {
      type: "send_message",
      platform: "discord",
      target: "#destek",
      textTemplate: "Yeni Telegram destek mesaji: {{text}}",
    },
    approvalRequired: true,
    status: "waiting_approval",
    maxAttempts: 3,
    createdAt: "2026-05-06T13:00:00Z",
  },
  plan: [
    "Telegram mesajlari n8n tarafindan alinir.",
    "Mesaj ortak Event JSON formatina cevrilir.",
    "Backend AI agent aktif gorevlerle anlamsal eslestirme yapar.",
    "Eslesirse Discord destek kanalina mesaj aksiyonu dondurulur.",
    "Sonuc dashboarda loglanir.",
  ],
  missingFields: [],
};

export function createMockPlan(message = "") {
  const normalized = message.toLocaleLowerCase("tr-TR");

  if (normalized.match(/mail|e-?posta|gmail/) && normalized.match(/ozet|özet|son 10/)) {
    return {
      type: "task_plan",
      task: {
        ...mockTasks[1],
        id: `task_mail_${Date.now()}`,
        status: "waiting_approval",
        createdAt: new Date().toISOString(),
      },
      plan: [
        "Mail connector son mesajlari alir.",
        "AI agent mail iceriklerini ozetler.",
        "Ozet dashboard run loguna yazilir.",
      ],
      missingFields: [],
    };
  }

  if (normalized.match(/odeme|ödeme|hatirlat|hatırlat|fatura/)) {
    return {
      type: "task_plan",
      task: {
        ...mockTasks[2],
        id: `task_payment_${Date.now()}`,
        status: "waiting_approval",
        createdAt: new Date().toISOString(),
      },
      plan: [
        "Mail eventleri ortak formata cevrilir.",
        "AI agent odeme tarihi anlamini kontrol eder.",
        "Eslesirse hatirlatma aksiyonu dashboarda loglanir.",
      ],
      missingFields: [],
    };
  }

  return {
    ...defaultPlan,
    task: {
      ...defaultPlan.task,
      id: `task_telegram_discord_${Date.now()}`,
      createdAt: new Date().toISOString(),
    },
  };
}
