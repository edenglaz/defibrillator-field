/**
 * שרת 1 – Express + JWT + SQLite (SQL)
 * פורט ברירת מחדל: 3001
 * אחראי: אדמין, CMS, Refresh Tokens
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db/sqlite');
const authRoutes = require('./routes/auth');
const cmsRoutes = require('./routes/cms');

const app = express();
const PORT = process.env.PORT || 3001;

initDb();

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', server: 'auth-cms-sqlite', db: 'SQLite' });
});

app.use('/api/auth', authRoutes);
app.use('/api/cms', cmsRoutes);

app.listen(PORT, () => {
  console.log(`[Server 1] Auth/CMS (SQLite) running on http://localhost:${PORT}`);
});
