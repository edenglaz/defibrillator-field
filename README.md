# דפיברילטור בשטח — Pro Bono

פרויקט סיום קורס **פיתוח WEB** — אפקה, סמסטר ב' 2026.

מערכת שיווקית ותפעולית לרישום בעלי **דפיברילטורים ניידים** ונושאי **LoRa** (433MHz) בשטח, עם **סימולטור WEB** לקריאת מצוקה: Geo-fencing, Geohash, התראות היברידיות (Push + SMS + LoRa Downlink מדומים), ואפליקציית מתנדב (Waze/Maps + Offline).

---

## כתובת בענן (Cloud)

| סביבה | כתובת |
|--------|--------|
| **אתר (Production)** | https://defibrillator-field.vercel.app |
| **GitHub** | https://github.com/edenglaz/defibrillator-field |
| **API סימולטור (Render)** | https://defibrillator-field.onrender.com/api |
| **API Auth/CMS (Render)** | https://defi-auth.onrender.com/api |
| **מקומי (פיתוח)** | http://localhost:3000 |

> **הערה:** שרתי Render (Free) עלולים להירדם אחרי חוסר פעילות — הטעינה הראשונה אחרי שינה עשויה לקחת ~30–50 שניות.

---

## על הפרויקט — מה המערכת עושה?

### הבעיה
מפת **איפה דפי** (מד"א) מציגה דפיברילטורים **נייחים** בלבד. רוכבים, מטיילים ומתנדבים עם דפיברילטור **נייד** בשטח — לרוב **ללא קליטה סלולרית** — לא מופיעים במפה.

### הפתרון
רשת **LoRa / Meshtastic** (433MHz) + אפליקציית מתנדב:
- **The Registry** — מאגר מכשירים: שם, טלפון, DevEUI, סטטוס, סוללה, מיקום (עדכון שקט שעתי)
- **Hybrid Alert** — Push/SMS לסלולר + LoRa Downlink (צפצוף/הבהוב) במקביל
- **Real-time Backend** — Geo-fencing + Geohash + דירוג לפי מרחק ו-ping אחרון
- **Incident Logic** — קריאת מצוקה → מתנדבים → ניווט → דיווח למוקד

### סימולטור (לפי דרישות הקורס)
אין צורך בחומרה אמיתית. כל התרחיש רץ בדפדפן: 50 מכשירים מדומים, מסלולי אופניים OSRM, התראות מדומות.

---

## ארכיטקטורה

```
┌─────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Next.js (web)  │────▶│  Server 1 :3001    │────▶│  SQLite (SQL)    │
│  Tailwind, RTL  │     │  Express + JWT     │     │  CMS, admins     │
└────────┬────────┘     └────────────────────┘     └──────────────────┘
         │
         └─────────────▶┌────────────────────┐     ┌──────────────────┐
                        │  Server 2 :3002    │────▶│  MongoDB (NoSQL) │
                        │  Fleet + Simulator │     │  devices, events │
                        └────────────────────┘     └──────────────────┘
```

| רכיב | טכנולוגיה | פורט | תפקיד |
|------|-----------|------|--------|
| **web** | Next.js 14 + TypeScript + Tailwind | 3000 | ממשק משתמש (עברית, RTL) |
| **server** | Express + JWT + **SQLite** | 3001 | אדמין, CMS, Refresh Tokens |
| **simulator-server** | Express + **MongoDB** | 3002 | צי, הרשמות, סימולטור מצוקה |

---

## דרישות מערכת

| דרישה | גרסה / הערה |
|--------|-------------|
| **Node.js** | 18 ומעלה |
| **npm** | מגיע עם Node |
| **MongoDB** | אופציונלי — אם לא מותקן, השרת עולה עם **In-Memory DB** (נתונים מתאפסים ב-restart) |
| **Git** | להעלאה ל-GitHub |

---

## התקנה — שלב אחר שלב (Windows)

### 1. שכפול / פתיחת הפרויקט

```powershell
cd "C:\Users\Eden Glazman\Desktop\afeka\defibrillator-field"
```

או אחרי clone מ-GitHub:

```powershell
git clone https://github.com/edenglaz/defibrillator-field.git
cd defibrillator-field
```

### 2. התקנת תלויות (כל 3 הפרויקטים)

```powershell
npm run install:all
```

או ידנית:

```powershell
cd server; npm install; cd ..
cd simulator-server; npm install; cd ..
cd web; npm install; cd ..
```

### 3. הרצה — **3 טרמינלים נפרדים**

**טרמינל 1 — Auth / CMS (SQLite):**

```powershell
cd server
npm start
```

צפוי: `[Server 1] Auth/CMS (SQLite) running on http://localhost:3001`

**טרמינל 2 — סימולטור + צי (MongoDB):**

```powershell
cd simulator-server
npm start
```

צפוי: seed של 50 מכשירים (בפעם הראשונה), `[Server 2] Simulator (MongoDB) on http://localhost:3002`

**טרמינל 3 — Frontend:**

```powershell
cd web
npm run dev
```

צפוי: `http://localhost:3000`

### 4. בדיקה מהירה

| URL | מה לבדוק |
|-----|-----------|
| http://localhost:3000 | דף בית בעברית + תרשים LoRa |
| http://localhost:3001/api/health | `{"status":"ok"}` |
| http://localhost:3002/api/health | `mongoConnected: true` |
| http://localhost:3000/emergency | הפעלת מצוקה + מפה |
| http://localhost:3000/admin | כניסה micha / 1234 |

### 5. (אופציונלי) Seed ידני

```powershell
cd simulator-server
npm run seed
```

---

## משתני סביבה (.env)

קבצי `.env` **לא** עולים ל-GitHub. אפשר ליצור לפי הצורך:

**server/.env**

```env
PORT=3001
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

**simulator-server/.env**

```env
PORT=3002
MONGO_URI=mongodb://127.0.0.1:27017/defibrillator_field
```

**web/.env.local** (אם ה-API לא על localhost)

```env
NEXT_PUBLIC_AUTH_API=http://localhost:3001/api
NEXT_PUBLIC_SIM_API=http://localhost:3002/api
```

---

## העלאה ל-GitHub

```powershell
cd defibrillator-field
git add .
git commit -m "Initial commit — defibrillator field project"
git branch -M main
git remote add origin https://github.com/edenglaz/defibrillator-field.git
git push -u origin main
```

> וודאי ש-`.gitignore` חוסם: `node_modules/`, `.env`, `web/.next/`, `*.db`

---

## העלאה לענן (אופציונלי — לכתובת ב-README)

מומלץ לסטודנטים:

| רכיב | שירות מומלץ |
|------|-------------|
| **web** (Next.js) | [Vercel](https://vercel.com) — חיבור ל-repo |
| **server** + **simulator-server** | [Render](https://render.com) או [Railway](https://railway.app) — Web Service |
| **MongoDB** | [MongoDB Atlas](https://www.mongodb.com/atlas) (חינמי) |

לאחר deploy:
1. הגדירי `NEXT_PUBLIC_AUTH_API` ו-`NEXT_PUBLIC_SIM_API` ב-Vercel
2. עדכני `CORS_ORIGIN` בשני שרתי Render ל-domain של Vercel

---

## דפים באתר

| דף | תיאור |
|----|--------|
| `/` | 3 שורות LoRa (CMS), תרשים זרימה, קישור **איפה דפי**, קול קורא |
| `/register` | הרשמה — שם, נייד, LoRa ID — **ללא סיסמה** |
| `/emergency` | סימולטור מצוקה, Geohash, מפה (~50 מכשירים ברדיוס), OSRM |
| `/volunteer` | אפליקציית מתנדב — Push, חלון אדום, Waze/Maps, Offline LoRa |
| `/fleet` | The Registry — צי, DevEUI, סוללה, ping שקט |
| `/dispatch` | מוקד — דיווח מתנדב בדרך, סגירת אירוע |
| `/lora-shops` | 4+ חנויות LoRa 433MHz + הוראות קונפיג Meshtastic |
| `/admin` | CMS + הרשמות (עריכה/מחיקה) + Push תחזוקה |

---

## אדמין

| | |
|---|---|
| **URL** | http://localhost:3000/admin |
| **משתמש** | `micha` |
| **סיסמה** | `1234` |
| **JWT** | Access 15 דק' + Refresh 7 ימים |

**אפשרויות:** עריכת דפי שיווק (SQLite CMS), צפייה/עריכה/מחיקת הרשמות, התראות תחזוקה סוללה.

---

## תרחיש הדגמה (End-to-End)

1. **`/volunteer`** — אשר הרשאת Push (טאב 1)
2. **`/emergency`** — הפעל קריאת מצוקה (טאב 2)
3. **`/volunteer`** — חלון אדום קופץ, אישור → Waze + Google Maps
4. **`/dispatch`** — דיווח למוקד: מתנדב בדרך + מרחק
5. **`/fleet`** — The Registry, ping שקט, Push תחזוקה &lt;20%

---

## API עיקרי

### Server 1 — Auth/CMS (3001)

| Method | Endpoint | תיאור |
|--------|----------|--------|
| POST | `/api/auth/login` | התחברות אדמין |
| POST | `/api/auth/refresh` | רענון JWT |
| GET | `/api/cms/pages` | דפי שיווק |
| PUT | `/api/cms/pages/:slug` | עריכת CMS (JWT) |

### Server 2 — Simulator (3002)

| Method | Endpoint | תיאור |
|--------|----------|--------|
| POST | `/api/register` | הרשמה + יצירת Device |
| PUT/DELETE | `/api/register/:id` | עריכה/מחיקה (אדמין) |
| GET | `/api/devices` | צי מלא |
| GET | `/api/devices/fleet-summary` | סיכום Registry |
| POST | `/api/devices/trigger-ping` | ping LoRa שקט ידני |
| POST | `/api/simulator/distress` | קריאת מצוקה + Geo-fencing |
| POST | `/api/simulator/incidents/:id/respond` | תגובת מתנדב + OSRM |
| POST | `/api/simulator/incidents/:id/resolve` | סגירת אירוע |

---

## Known Bugs / מגבלות

1. **Push / SMS / LoRa Downlink** — מדומים (אין FCM / SMS gateway / חומרה)
2. **OSRM** — API ציבורי; לפעמים fallback לקו ישר
3. **Breadcrumbs** — מיושם via OSRM אופניים (לא API רשמי של עמי ותמי)
4. **מפות Offline** — סימולציית Cache, לא PWA אמיתי
5. **In-Memory MongoDB** — אם אין MongoDB מקומי, נתונים מתאפסים ב-restart

---

## קישורים חיצוניים

- [איפה דפי — מד"א (דפיברילטורים נייחים)](https://defi.co.il/#/map)
- [Meshtastic](https://meshtastic.org/)
- [OSRM](http://project-osrm.org/)

---

## מבנה תיקיות

```
defibrillator-field/
├── web/                 # Next.js — Frontend
├── server/              # Express + SQLite — Auth, CMS
├── simulator-server/    # Express + MongoDB — Fleet, Simulator
├── docs/                # מצגת הגנה
├── README.md            # קובץ זה
└── package.json         # סקריפטים מרכזיים
```

---

## רישיון

פרויקט לימודי — Pro Bono / אפקה 2026.
