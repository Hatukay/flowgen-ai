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

    const json = await response.json();

    // Unwrap backend envelope { success, data } when present
    if (json.success !== undefined && json.data !== undefined) {
      return json.data;
    }

    return json;
  } catch {
    await wait(fallbackDelay);
    return fallback();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function createChatPlan(message) {
  return request(
    "/api/chat",
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
    () => createMockPlan(message),
    600,
  );
}

export async function getTasks() {
  return request("/api/tasks", { method: "GET" }, () => mockTasks);
}

export async function getRuns() {
  return request("/api/runs", { method: "GET" }, () => mockRuns);
}

export async function approveTask(id) {
  return request(
    `/api/tasks/${id}/approve`,
    { method: "POST" },
    () => ({ id, status: "active" }),
  );
}

export async function testTask(id) {
  return request(`/api/tasks/${id}/test`, { method: "POST" }, () => mockTestResult, 450);
}
