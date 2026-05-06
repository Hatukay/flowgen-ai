export const demoPrompts = [
  "Telegram şikayetlerini Slack’e gönder",
  "Son 10 maili özetle",
  "Ödeme tarihi yaklaşan maili bul",
];

export const mockTasks = [
  {
    id: "task_mail_summary",
    title: "Son 10 maili özetle",
    description: "Mock mail listesindeki son 10 mesajı özetleyip ekibe gönderir.",
    category: "Mail",
    triggerType: "instant",
    source: "Mail",
    target: "Slack",
    status: "active",
    workflowTemplate: "mail_summary",
    createdAt: "2026-05-06T10:15:00Z",
  },
  {
    id: "task_payment_reminder",
    title: "Ödeme tarihi yaklaşan maili hatırlat",
    description: "Mail içeriğinden ödeme tarihi çıkarır ve hatırlatma kaydı oluşturur.",
    category: "Ödeme",
    triggerType: "scheduled",
    source: "Mail",
    target: "Telegram",
    status: "active",
    workflowTemplate: "payment_reminder",
    createdAt: "2026-05-06T10:40:00Z",
  },
  {
    id: "task_hr_notify",
    title: "HR aday bilgilendirme mesajlarını sırala",
    description: "Aday mesajlarını kategoriye göre ayırıp operasyon listesine ekler.",
    category: "HR",
    triggerType: "triggered",
    source: "Mail",
    target: "Slack",
    status: "active",
    workflowTemplate: "candidate_message_router",
    createdAt: "2026-05-06T11:05:00Z",
  },
];

export const mockRuns = [
  {
    id: "run_005",
    taskId: "task_payment_reminder",
    status: "tested",
    summary: "Ödeme hatırlatıcısı planlandı.",
    createdAt: "2026-05-06T13:35:00Z",
  },
  {
    id: "run_004",
    taskId: "task_mail_summary",
    status: "success",
    summary: "Son 10 mail özetlendi.",
    createdAt: "2026-05-06T13:20:00Z",
  },
  {
    id: "run_003",
    taskId: "task_telegram_slack",
    status: "success",
    summary: "Telegram şikayeti Slack’e gönderildi.",
    createdAt: "2026-05-06T13:05:00Z",
  },
  {
    id: "run_002",
    taskId: "task_mail_summary",
    status: "success",
    summary: "Mail özet akışı mock data ile test edildi.",
    createdAt: "2026-05-06T12:40:00Z",
  },
  {
    id: "run_001",
    taskId: "task_payment_reminder",
    status: "partial",
    summary: "Ödeme tarihi çıkarımı test edildi.",
    createdAt: "2026-05-06T12:15:00Z",
  },
];

export const mockTestResult = {
  status: "passed",
  checks: [
    { name: "Template seçildi", result: "passed" },
    { name: "Kaynak ve hedef tanımlı", result: "passed" },
    { name: "Onay mekanizması aktif", result: "passed" },
    { name: "Slack hedefi tanımlı", result: "passed" },
    { name: "Test mesajı başarıyla işlendi", result: "passed" },
  ],
  aiFeedback: "Görev güvenli şekilde aktifleştirilebilir.",
};

export const defaultPlan = {
  intent: "create_task",
  task: {
    id: "task_telegram_slack_pending",
    title: "Telegram şikayetlerini Slack destek kanalına gönder",
    description: "Telegramdan gelen şikayet mesajlarını Slack destek kanalına iletir.",
    category: "Destek",
    triggerType: "triggered",
    source: "Telegram",
    target: "Slack",
    status: "waiting_approval",
    workflowTemplate: "telegram_to_slack_complaint",
    createdAt: "2026-05-06T13:00:00Z",
  },
  plan: [
    "Telegram mesajlarını dinle",
    "Şikayet içeren mesajları sınıflandır",
    "Slack destek kanalına formatlı mesaj gönder",
    "Backend’e run kaydı oluştur",
    "Dashboard’da sonucu göster",
  ],
  needsApproval: true,
};

export function createMockPlan(message = "") {
  const normalized = message.toLocaleLowerCase("tr-TR");

  if (normalized.includes("mail") && normalized.includes("özet")) {
    return {
      intent: "create_task",
      task: {
        id: `task_mail_${Date.now()}`,
        title: "Son 10 maili özetle",
        description: "Mail kutusundaki son 10 mesajı özetleyip seçili kanala gönderir.",
        category: "Mail",
        triggerType: "instant",
        source: "Mail",
        target: "Slack",
        status: "waiting_approval",
        workflowTemplate: "mail_summary",
        createdAt: new Date().toISOString(),
      },
      plan: [
        "Mail listesinden son 10 mesajı al",
        "Mesajları konu, gönderen ve aksiyonlara göre özetle",
        "Özeti Slack kanalına gönder",
        "Backend’e run kaydı oluştur",
      ],
      needsApproval: true,
    };
  }

  if (normalized.includes("ödeme") || normalized.includes("hatırlat")) {
    return {
      intent: "create_task",
      task: {
        id: `task_payment_${Date.now()}`,
        title: "Ödeme tarihi yaklaşan maili bul ve hatırlat",
        description: "Mail içinden ödeme tarihlerini çıkarır ve hatırlatma akışı başlatır.",
        category: "Ödeme",
        triggerType: "scheduled",
        source: "Mail",
        target: "Telegram",
        status: "waiting_approval",
        workflowTemplate: "payment_reminder",
        createdAt: new Date().toISOString(),
      },
      plan: [
        "Mail içeriklerinde ödeme tarihi ara",
        "AI ile tarih ve tutar bilgisini çıkar",
        "Yaklaşan tarih varsa hatırlatma planla",
        "Sonucu dashboard’a kaydet",
      ],
      needsApproval: true,
    };
  }

  return {
    ...defaultPlan,
    task: {
      ...defaultPlan.task,
      id: `task_telegram_${Date.now()}`,
      createdAt: new Date().toISOString(),
    },
  };
}
