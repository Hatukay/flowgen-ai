import { createMockPlan, mockRuns, mockTasks, mockTestResult } from "../data/mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const REQUEST_TIMEOUT_MS = 5000;

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Generic request wrapper with mock fallback.
 * When the backend is reachable, uses the real API response.
 * Falls back to mock data when the backend is offline (hackathon-safe).
 */
function unwrapResponse(json) {
  if (json?.success !== undefined && json?.data !== undefined) return json.data;
  return json;
}

function normalizeTask(task = {}) {
  return {
    ...task,
    id: task.id,
    title: task.title || task.name || "Yeni otomasyon gorevi",
    description: task.description || task.condition || "Dogal dil ile olusturulan otomasyon gorevi.",
    sourcePlatform: task.sourcePlatform || task.source || "any",
    triggerType: task.triggerType || task.trigger?.type || "triggered",
    category: task.category || "Diger",
    action: task.action || {
      type: task.actionType || "log_to_dashboard",
      platform: task.target || task.actionPlatform || "dashboard",
      target: task.target || "dashboard",
      textTemplate: task.textTemplate || "{{text}}",
    },
    approvalRequired: task.approvalRequired ?? task.needsApproval ?? true,
    status: task.status || "waiting_approval",
    maxAttempts: task.maxAttempts || 3,
    createdAt: task.createdAt || new Date().toISOString(),
  };
}

function normalizeRun(run = {}) {
  const taskId = run.matchedTaskId || run.taskId || null;
  return {
    ...run,
    id: run.id || `run_${Date.now()}`,
    taskId,
    matchedTaskId: taskId,
    status: run.status || "skipped",
    platform: run.platform || run.sourcePlatform || run.source || "system",
    actionPlatform: run.actionPlatform || run.targetPlatform || run.target || null,
    confidence: run.confidence ?? null,
    summary: run.summary || run.outputSummary || run.reason || "Run kaydi olusturuldu.",
    reason: run.reason || run.summary || "",
    createdAt: run.createdAt || new Date().toISOString(),
  };
}

function normalizePlan(payload = {}) {
  const source = unwrapResponse(payload);
  const task = normalizeTask(source.task || source);

  return {
    ...source,
    type: source.type || source.intent || "task_plan",
    task,
    plan: Array.isArray(source.plan) && source.plan.length > 0
      ? source.plan
      : [
          "n8n event verisini ortak formata cevirir.",
          "Backend AI agent aktif gorevlerle eslestirme yapar.",
          "Sonuc dashboarda run log olarak yazilir.",
        ],
    missingFields: Array.isArray(source.missingFields) ? source.missingFields : [],
  };
}

function normalizeTestResult(result = {}) {
  const source = unwrapResponse(result);
  return {
    status: source.status || "failed",
    checks: Array.isArray(source.checks) ? source.checks : [],
    aiFeedback: source.aiFeedback || source.error || "Test sonucu alindi.",
  };
}

async function request(path, options, fallback, fallbackDelay = 150) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    return await response.json();
  } catch {
    await wait(fallbackDelay);
    return fallback();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function createChatPlan(message) {
  const payload = await request(
    "/api/chat",
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
    () => createMockPlan(message),
    600,
  );
  return normalizePlan(payload);
}

export async function getTasks() {
  const payload = await request("/api/tasks", { method: "GET" }, () => mockTasks);
  const tasks = unwrapResponse(payload);
  return Array.isArray(tasks) ? tasks.map(normalizeTask) : mockTasks;
}

export async function getRuns() {
  const payload = await request("/api/runs", { method: "GET" }, () => mockRuns);
  const runs = unwrapResponse(payload);
  return Array.isArray(runs) ? runs.map(normalizeRun) : mockRuns;
}

export async function approveTask(id) {
  const payload = await request(
    `/api/tasks/${id}/approve`,
    { method: "POST" },
    () => ({ task: { id, status: "active" } }),
  );
  return {
    task: normalizeTask(payload.task || payload.data || payload),
    run: payload.run ? normalizeRun(payload.run) : null,
  };
}

export async function testTask(id) {
  const payload = await request(`/api/tasks/${id}/test`, { method: "POST" }, () => mockTestResult, 450);
  return normalizeTestResult(payload);
}
