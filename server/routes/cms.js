/**
 * CMS – עריכת דפי שיווק (SQLite).
 * נתיבים מוגנים ב-verifyToken – רק אדמין מחובר יכול לערוך.
 */
const express = require('express');
const { getDb } = require('../db/sqlite');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

router.get('/pages', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  const pages = getDb().prepare('SELECT slug, title, content, updated_at FROM cms_pages').all();
  res.json(pages);
});

router.get('/pages/:slug', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const page = getDb()
    .prepare('SELECT slug, title, content, updated_at FROM cms_pages WHERE slug = ?')
    .get(req.params.slug);
  if (!page) return res.status(404).json({ error: 'דף לא נמצא' });
  res.json(page);
});

router.put('/pages/:slug', verifyToken, (req, res) => {
  const { title, content } = req.body;
  const db = getDb();
  const result = db
    .prepare(
      `UPDATE cms_pages SET title = ?, content = ?, updated_at = datetime('now') WHERE slug = ?`
    )
    .run(title, content, req.params.slug);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'דף לא נמצא' });
  }

  db.prepare('INSERT INTO audit_log (action, details) VALUES (?, ?)').run(
    'CMS_UPDATE',
    req.params.slug
  );
  res.json({ success: true });
});

module.exports = router;
