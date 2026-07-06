/**
 * SQLite (SQL) – מסד נתונים יחסי לתוכן שיווקי, אדמין ולוגים.
 * אם תסיר את initDb() – הטבלאות לא ייווצרו והשרת ייכשל בכל שאילתה.
 */
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'admin.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

function initDb() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cms_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (admin_id) REFERENCES admins(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const adminExists = database.prepare('SELECT id FROM admins WHERE username = ?').get('micha');
  if (!adminExists) {
    const hash = bcrypt.hashSync('1234', 10);
    database.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('micha', hash);
  }

  const defaultPages = [
    {
      slug: 'home-intro',
      title: 'דף הבית – הקדמה',
      content:
        'LoRa (Long Range) היא טכנולוגיית תקשורת רדיו המאפשרת להעביר נתונים למרחקים של קילומטרים רבים בצריכת חשמל נמוכה במיוחד, גם ללא רשת סלולרית או חיבור לאינטרנט.\n\nMeshtastic היא תוכנה הפועלת על גבי מכשירי LoRa והופכת אותם לרשת Mesh, שבה כל מכשיר יכול להעביר הודעות למכשירים אחרים וכך להרחיב את טווח התקשורת.\n\nבקריאת מצוקה, המערכת מאתרת את בעלי הדפיברילטורים הקרובים ביותר ושולחת אליהם התראה דרך רשת LoRa או באמצעות הטלפון, כדי לקצר את זמן ההגעה ולהגדיל את סיכויי ההצלה.',
    },
    {
      slug: 'call-to-action',
      title: 'קול קורא',
      content: 'הצטרפו למיזם! רשמו את הדפיברילטור הנייד שלכם, רכשו מכשיר LoRa בתדר 433MHz, והצילו חיים בשטח.',
    },
    {
      slug: 'maintenance',
      title: 'אחזקה',
      content: 'בדקו סוללת LoRa פעם בשבוע. החליפו סוללות דפיברילטור לפי הוראות היצרן. דווחו על תקלה דרך האתר.',
    },
    {
      slug: 'purchase',
      title: 'רכישה',
      content: 'רכשו מכשיר Meshtastic/LoRa בתדר 433MHz – ראו קישורים בדף חנויות LoRa.',
    },
    {
      slug: 'registration',
      title: 'רישום',
      content:
        'הרשמה בטלפון נייד בלבד, ללא סיסמה — לבעלי דפיברילטור נייד (עם/בלי LoRa) או נושאי LoRa בלבד: מדריכים, רוכבים ובעלי בתים בשטח.',
    },
  ];

  const insertPage = database.prepare(
    'INSERT OR IGNORE INTO cms_pages (slug, title, content) VALUES (?, ?, ?)'
  );
  for (const page of defaultPages) {
    insertPage.run(page.slug, page.title, page.content);
  }

  database
    .prepare(
      `UPDATE cms_pages SET content = ?, title = ? WHERE slug = 'home-intro' AND length(content) < 200`
    )
    .run(
      defaultPages[0].content,
      defaultPages[0].title
    );

  const regCms = defaultPages.find((p) => p.slug === 'registration');
  if (regCms) {
    database
      .prepare(`UPDATE cms_pages SET content = ? WHERE slug = 'registration' AND length(content) > 120`)
      .run(regCms.content);
  }

  const regPageExists = database.prepare('SELECT id FROM cms_pages WHERE slug = ?').get('registration');
  if (!regPageExists) {
    database
      .prepare('INSERT INTO cms_pages (slug, title, content) VALUES (?, ?, ?)')
      .run(
        'registration',
        'רישום',
        'הירשמו למיזם ללא סיסמה: בעלי דפיברילטור נייד (עם או בלי LoRa), או נושאי LoRa בלבד — מדריכים, רוכבים ובעלי בתים בשטח.'
      );
  }
}

module.exports = { getDb, initDb };
