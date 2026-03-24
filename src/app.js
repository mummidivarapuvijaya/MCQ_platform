require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDb } = require('./db');
const { router } = require('./routes');

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','), credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 120 }));

let dbConnectionPromise = null;
async function ensureDbConnection() {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDb();
  }
  await dbConnectionPromise;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/', (_req, res) => res.json({ ok: true, message: 'MCQ server is running' }));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', router);

module.exports = { app };
