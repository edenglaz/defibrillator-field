/**
 * אימות אדמין – JWT עם Access (15 דק') + Refresh (7 ימים).
 * bcrypt משווה סיסמה מול hash ב-SQLite – לעולם לא שומרים סיסמה גolova.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/sqlite');
const { ACCESS_SECRET } = require('../middleware/verifyToken');

const router = express.Router();
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'defib-refresh-secret-change-in-prod';

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDb();
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);

  if (!admin) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  if (!bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const payload = { id: admin.id, username: admin.username };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)').run(
    admin.id,
    refreshToken,
    expiresAt
  );

  res.json({ accessToken, refreshToken, username: admin.username });
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh Token חסר' });
  }

  const db = getDb();
  const saved = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(refreshToken);
  if (!saved) {
    return res.status(403).json({ error: 'Refresh Token לא מוכר (logout?)' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const newAccess = jwt.sign(
      { id: decoded.id, username: decoded.username },
      ACCESS_SECRET,
      { expiresIn: '15m' }
    );
    res.json({ accessToken: newAccess });
  } catch {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
    return res.status(403).json({ error: 'Refresh Token פג תוקף' });
  }
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    getDb().prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
  }
  res.json({ success: true });
});

module.exports = router;
