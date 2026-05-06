require('dotenv').config();
const express = require('express');
const cors = require('cors');

const healthRouter   = require('./routes/health');
const tasksRouter    = require('./routes/tasks');
const runsRouter     = require('./routes/runs');
const chatRouter     = require('./routes/chat');
const workflowRouter = require('./routes/workflow');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/health',   healthRouter);
app.use('/api/chat',     chatRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/tasks',    tasksRouter);
app.use('/api/runs',     runsRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[GlobalError]', err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀  FlowGen API running on http://localhost:${PORT}`);
  console.log(`    ENV: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
