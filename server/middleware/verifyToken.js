/**
 * Middleware – אימות JWT (Access Token).
 * אם תסיר את jwt.verify – כל נתיב מוגן יהיה פתוח ללא הזדהות.
 */
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'defib-access-secret-change-in-prod';

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'נדרש Access Token' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Token לא תקף או פג תוקף' });
  }
}

module.exports = { verifyToken, ACCESS_SECRET };
