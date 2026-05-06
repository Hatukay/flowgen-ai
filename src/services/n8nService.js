/**
 * src/services/n8nService.js
 *
 * Thin wrapper around the n8n Cloud REST API.
 * Docs: https://docs.n8n.io/api/
 *
 * Required env vars:
 *   N8N_BASE_URL  — e.g. https://your-instance.app.n8n.cloud
 *   N8N_API_KEY   — from n8n Settings → API
 */

const https = require('https');
const http  = require('http');
const url   = require('url');

// ─── Internal fetch helper (no external deps) ────────────────────────────────

/**
 * Minimal HTTP/HTTPS request helper that returns { status, body }.
 * Keeps the service dependency-free beyond Node built-ins.
 *
 * @param {string} method
 * @param {string} endpoint   - path relative to N8N_BASE_URL, e.g. "/api/v1/workflows"
 * @param {object|null} data  - JSON body (for POST/PUT)
 * @returns {Promise<{ status: number, body: object }>}
 */
const n8nRequest = (method, endpoint, data = null) => {
  const baseUrl = process.env.N8N_BASE_URL;
  const apiKey  = process.env.N8N_API_KEY;

  if (!baseUrl) throw new Error('N8N_BASE_URL is not set in environment variables.');
  if (!apiKey)  throw new Error('N8N_API_KEY is not set in environment variables.');

  const parsed  = url.parse(`${baseUrl.replace(/\/$/, '')}${endpoint}`);
  const isHttps = parsed.protocol === 'https:';
  const lib     = isHttps ? https : http;

  const body = data ? JSON.stringify(data) : null;

  const options = {
    hostname: parsed.hostname,
    port:     parsed.port || (isHttps ? 443 : 80),
    path:     parsed.path,
    method,
    headers: {
      'X-N8N-API-KEY': apiKey,
      'Content-Type':  'application/json',
      'Accept':        'application/json',
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        let parsed;
        try   { parsed = JSON.parse(raw); }
        catch { parsed = { raw }; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new workflow in n8n (inactive by default).
 * @param {object} workflowJson - Full n8n workflow object from Gemini.
 * @returns {Promise<object>}   - Created workflow from n8n (includes its `id`).
 */
const createWorkflow = async (workflowJson) => {
  const { status, body } = await n8nRequest('POST', '/api/v1/workflows', workflowJson);

  if (status !== 200 && status !== 201) {
    const err = new Error(`n8n rejected workflow creation (HTTP ${status}).`);
    err.status = status;
    err.n8nError = body;
    throw err;
  }

  return body;
};

/**
 * Activate an existing workflow by its n8n ID.
 * @param {string} n8nWorkflowId
 * @returns {Promise<object>}
 */
const activateWorkflow = async (n8nWorkflowId) => {
  const { status, body } = await n8nRequest('POST', `/api/v1/workflows/${n8nWorkflowId}/activate`);

  if (status !== 200) {
    const err = new Error(`Failed to activate workflow ${n8nWorkflowId} (HTTP ${status}).`);
    err.status = status;
    err.n8nError = body;
    throw err;
  }

  return body;
};

/**
 * Execute a workflow manually by its n8n ID (triggers a test run).
 * @param {string} n8nWorkflowId
 * @returns {Promise<object>}   - Execution record from n8n.
 */
const executeWorkflow = async (n8nWorkflowId) => {
  const { status, body } = await n8nRequest(
    'POST',
    `/api/v1/workflows/${n8nWorkflowId}/run`,
    {}
  );

  if (status !== 200 && status !== 201) {
    const err = new Error(`Failed to execute workflow ${n8nWorkflowId} (HTTP ${status}).`);
    err.status = status;
    err.n8nError = body;
    throw err;
  }

  return body;
};

/**
 * Fetch the list of all workflows in the n8n instance.
 * @returns {Promise<object[]>}
 */
const listWorkflows = async () => {
  const { status, body } = await n8nRequest('GET', '/api/v1/workflows');

  if (status !== 200) {
    const err = new Error(`Failed to list workflows (HTTP ${status}).`);
    err.status = status;
    err.n8nError = body;
    throw err;
  }

  return body.data ?? body;
};

/**
 * Delete a workflow from n8n by its ID.
 * @param {string} n8nWorkflowId
 * @returns {Promise<void>}
 */
const deleteWorkflow = async (n8nWorkflowId) => {
  const { status, body } = await n8nRequest('DELETE', `/api/v1/workflows/${n8nWorkflowId}`);

  if (status !== 200 && status !== 204) {
    const err = new Error(`Failed to delete workflow ${n8nWorkflowId} (HTTP ${status}).`);
    err.status = status;
    err.n8nError = body;
    throw err;
  }
};

module.exports = { createWorkflow, activateWorkflow, executeWorkflow, listWorkflows, deleteWorkflow };
