# דפיברילטור בשטח — Pro Bono

פרויקט סיום קורס **פיתוח WEB** — אפקה, סמסטר ב' 2026.

---

## כתובת בענן

| | |
|---|---|
| **מבצעים** | עדן גלזמן, לין סבאג |
| **אתר** | **https://defibrillator-field.vercel.app** |
| **GitHub (עדן)** | https://github.com/edenglaz/defibrillator-field |
| **GitHub (לין)** | https://github.com/linsabag/defibrillator-field |

---

## על הפרויקט

מערכת שיווקית ותפעולית לרישום בעלי **דפיברילטורים ניידים** ונושאי **LoRa** (433MHz) בשטח, עם **סימולטור WEB** לקריאת מצוקה.

### הבעיה
מפת [איפה דפי](https://defi.co.il/#/map) (מד"א) מציגה דפיברילטורים **נייחים** בלבד. מתנדבים עם דפיברילטור **נייד** בשטח — לעיתים **ללא קליטה סלולרית** — לא מופיעים במפה.

### הפתרון
רשת **LoRa / Meshtastic** + אפליקציית מתנדב (מדומה ב-WEB):

| רכיב | תיאור |
|------|--------|
| **The Registry** | מאגר מכשירים — שם, טלפון, DevEUI, סטטוס, סוללה, מיקום (ping שקט שעתי) |
| **Hybrid Alert** | Push + SMS + LoRa Downlink במקביל (מדומים) |
| **Real-time Backend** | Geo-fencing, Geohash, דירוג לפי מרחק ו-ping |
| **Incident Logic** | מצוקה → מתנדבים → ניווט → דיווח למוקד |

לפי דרישות הקורס: **סימולטור WEB** — 50 מכשירים מדומים, מסלולי אופניים OSRM, ללא חומרה אמיתית.

### ארכיטקטורה

| רכיב | טכנולוגיה | תפקיד |
|------|-----------|--------|
| **web** | Next.js 14 + Tailwind (עברית, RTL) | ממשק משתמש |
| **server** | Express + JWT + **SQLite** | אדמין, CMS |
| **simulator-server** | Express + **MongoDB** | צי, הרשמות, סימולטור מצוקה |

### דפים באתר

| דף | תיאור |
|----|--------|
| `/` | הסבר LoRa, תרשים זרימה, קישור מד"א |
| `/register` | הרשמה — שם, נייד, LoRa ID (ללא סיסמה) |
| `/emergency` | סימולטור מצוקה + מפה + Geohash |
| `/volunteer` | אפליקציית מתנדב — Push, Waze/Maps, Offline |
| `/fleet` | The Registry — צי, DevEUI, סוללה |
| `/dispatch` | מוקד — דיווח מתנדב בדרך |
| `/lora-shops` | חנויות LoRa 433MHz |
| `/admin` | CMS + ניהול הרשמות (micha / 1234) |

### תרחיש הדגמה (End-to-End)

1. `/volunteer` — אשר הרשאת Push  
2. `/emergency` — הפעל קריאת מצוקה  
3. `/volunteer` — חלון אדום → אישור → Waze + Maps  
4. `/dispatch` — דיווח למוקד  

---

## דרך התקנה והרצה (מקומי)

### דרישות

- **Node.js** 18+
- **npm**
- **MongoDB** — אופציונלי (אם לא מותקן, השרת עולה עם In-Memory DB)

### 1. שכפול הפרויקט

```powershell
git clone https://github.com/edenglaz/defibrillator-field.git
cd defibrillator-field
```

### 2. התקנת תלויות

```powershell
npm run install:all
```

### 3. הרצה — 3 טרמינלים

**טרמינל 1 — Auth/CMS (פורט 3001):**
```powershell
cd server
npm start
```

**טרמינל 2 — סימולטור (פורט 3002):**
```powershell
cd simulator-server
npm start
```
בפעם הראשונה: seed אוטומטי של 50 מכשירים.

**טרמינל 3 — Frontend (פורט 3000):**
```powershell
cd web
npm run dev
```

### 4. בדיקה

| URL | בדיקה |
|-----|--------|
| http://localhost:3000 | דף בית בעברית |
| http://localhost:3001/api/health | `status: ok` |
| http://localhost:3002/api/health | `mongoConnected: true` |
| http://localhost:3000/emergency | סימולטור מצוקה |
| http://localhost:3000/admin | micha / 1234 |

### משתני סביבה (אופציונלי)

לפיתוח מקומי — קבצי `.env` (לא עולים ל-GitHub):

- `server/.env` — `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `simulator-server/.env` — `MONGO_URI`
- `web/.env.local` — `NEXT_PUBLIC_AUTH_API`, `NEXT_PUBLIC_SIM_API`

---

## מגבלות ידועות

- Push / SMS / LoRa Downlink — **מדומים** (לפי מפרט הקורס)
- OSRM ציבורי — לפעמים fallback לקו ישר
- מפות Offline — סימולציה, לא PWA אמיתי

---

פרויקט לימודי — Pro Bono / אפקה 2026.
