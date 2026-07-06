# שקף הגנה — דפיברילטור בשטח Pro Bono

**קורס:** פיתוח WEB — אפקה, סמסטר ב' 2026

---

## דף 1 — פרטי הפרויקט

| | |
|---|---|
| **שמות המבצעים** | עדן גלזמן |
| **GitHub** | https://github.com/edenglaz/defibrillator-field |
| **ענן (Production)** | https://defibrillator-field.vercel.app |

### שרתי API בענן

| שרת | כתובת |
|-----|--------|
| סימולטור + צי (MongoDB) | https://defibrillator-field.onrender.com |
| Auth + CMS (SQLite) | https://defi-auth.onrender.com |

### דפים להדגמה

| דף | URL |
|----|-----|
| בית | https://defibrillator-field.vercel.app |
| מצוקה | https://defibrillator-field.vercel.app/emergency |
| מתנדב | https://defibrillator-field.vercel.app/volunteer |
| הרשמה | https://defibrillator-field.vercel.app/register |
| Registry | https://defibrillator-field.vercel.app/fleet |
| אדמין | https://defibrillator-field.vercel.app/admin (micha / 1234) |

> אם עבדתם בזוג — הוסיפו כאן את שם השותף/ה.

---

## דף 2 — Known Bugs / בעיות ידועות

### מגבלות מכוונות (לפי מפרט הקורס — סימולטור WEB)

1. **Push / SMS / LoRa Downlink** — מדומים בלבד. אין FCM, SMS gateway או חומרת LoRa/Gateway אמיתית.
2. **Bluetooth / Meshtastic** — כפתור מדמה חיבור; אין BLE אמיתי.
3. **מפות Offline** — החלפת שכבת מפה (Cache simulation), לא PWA עם הורדת מפות.
4. **Breadcrumbs** — מיושם via OSRM אופניים; לא API רשמי של עמי ותמי.

### בעיות טכניות ידועות

5. **Render Free (שרתי API)** — אחרי חוסר פעילות השרת "נרדם"; הטעינה הראשונה אחרי שינה עשויה לקחת 30–50 שניות.
6. **OSRM ציבורי** — לפעמים לא זמין; המערכת עוברת ל-fallback של קו ישר על המפה.
7. **חלון מצוקה ב-`/volunteer`** — לפעמים דורש שני טאבים (emergency + volunteer) או רענון; סנכרון cross-tab ב-localStorage + BroadcastChannel.
8. **SQLite על Render** — נתוני CMS עלולים להתאפס ב-deploy מחדש (תוכן ברירת מחדל חוזר).

### מה לא באג

- אין חומרה — **המפרט מאפשר סימולטור WEB בלי קניית מכשירים**.

---

## דף 3 — מבנה ארכיטקטוני

```
                    ┌─────────────────────────────────────┐
                    │   Vercel — Next.js 14 + Tailwind    │
                    │   https://defibrillator-field.      │
                    │        vercel.app (עברית, RTL)      │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    │
   ┌──────────────────┐  ┌──────────────────┐        │
   │  Server 1        │  │  Server 2        │        │
   │  Express + JWT   │  │  Express         │        │
   │  Render          │  │  Render          │        │
   │  defi-auth       │  │  defibrillator-  │        │
   │                  │  │  field           │        │
   └────────┬─────────┘  └────────┬─────────┘        │
            ▼                     ▼                   │
   ┌──────────────────┐  ┌──────────────────┐        │
   │  SQLite (SQL)    │  │  MongoDB Atlas   │        │
   │  admins, cms,    │  │  devices,        │        │
   │  refresh_tokens  │  │  incidents,      │        │
   │                  │  │  registrations   │        │
   └──────────────────┘  └──────────────────┘        │
```

### זרימת End-to-End

```
זיהוי (סימולטור/101/אפליקציה)
    → Geohash + Geo-fencing (שרת 2)
    → דירוג לפי ping + מרחק
    → Hybrid Alert (Push + SMS + LoRa — מדומים)
    → מתנדב: Waze/Maps + OSRM
    → דיווח למוקד (/dispatch)
```

### טכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind, Leaflet |
| Auth/CMS | Express, JWT (15m + Refresh 7d), SQLite |
| Fleet/Simulator | Express, MongoDB, Geohash, OSRM |
| ענן | Vercel + Render + MongoDB Atlas |

---

## דף 4 — קטע קוד: Geohash + Geo-fencing

**קובץ:** `simulator-server/utils/geohash.js`  
**תפקיד:** סינון מהיר של מכשירים ברדיוס — קודם Geohash (תאים שכנים), אחר כך Haversine מדויק.

```javascript
function filterByGeohashAndRadius(devices, centerLat, centerLon, radiusMeters) {
  const prefixes = neighborPrefixes(centerLat, centerLon, 5);
  const candidates = devices.filter((d) => {
    if (!d.geohash) return true;
    return prefixes.some((p) => d.geohash.startsWith(p.slice(0, 5)));
  });
  return candidates
    .map((d) => ({
      ...d,
      distanceMeters: Math.round(haversineMeters(centerLat, centerLon, d.lat, d.lon)),
    }))
    .filter((d) => d.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}
```

**אם נסיר:** לא יהיה Geo-fencing — כל המכשירים ייבדקו בלי צמצום, איטי ולא תואם מפרט.

---

## דף 5 — קטע קוד: סימולטור מצוקה + Hybrid Alert

**קובץ:** `simulator-server/routes/distress.js`  
**תפקיד:** קריאת מצוקה → דירוג זמינות → יצירת Incident → התראות היברידיות.

```javascript
const nearby = filterByGeohashAndRadius(devices, lat, lon, radiusMeters);
const prioritized = nearby
  .filter((d) => d.hasDefibrillator)
  .sort((a, b) => {
    const ageA = Date.now() - new Date(a.lastPingAt).getTime();
    const ageB = Date.now() - new Date(b.lastPingAt).getTime();
    if (Math.abs(ageA - ageB) > 60000) return ageA - ageB;
    return a.distanceMeters - b.distanceMeters;
  });
// hybridAlerts: pushSent, loraDownlinkSent, smsSimulated
```

**דירוג:** קודם מכשיר עם ping עדכני (60 שנ'), אחר כך מרחק.  
**אם נסיר:** לא יהיה סימולטור מצוקה ולא Incident Logic.

---

## דף 6 — קטע קוד: JWT + Refresh Token

**קובץ:** `server/routes/auth.js`  
**תפקיד:** התחברות אדמין — Access 15 דקות, Refresh 7 ימים, bcrypt לסיסמה.

```javascript
const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
db.prepare('INSERT INTO refresh_tokens (admin_id, token, expires_at) VALUES (?, ?, ?)')
  .run(admin.id, refreshToken, expiresAt);
res.json({ accessToken, refreshToken, username: admin.username });
```

**קובץ:** `web/src/lib/api.ts` — רענון אוטומטי ב-401:

```typescript
if (res.status === 401 && refreshToken) {
  const refreshRes = await fetch(`${AUTH_API}/auth/refresh`, { ... });
  if (refreshRes.ok) {
    const data = await refreshRes.json();
    localStorage.setItem('accessToken', data.accessToken);
    res = await fetch(url, { ...options, headers });
  }
}
```

**אם נסיר:** אדמין יתנתק כל 15 דקות בלי רענון אוטומטי.

---

## דף 7 — קטע קוד: Registry — Ping שקט + תחזוקה

**קובץ:** `simulator-server/utils/loraPingSimulator.js`  
**תפקיד:** כל שעה — עדכון GPS + סוללה; Push אם סוללה < 20%.

- `PING_INTERVAL_MS = 60 * 60 * 1000` — עדכון שקט שעתי
- `sendMaintenancePushIfNeeded()` — cooldown 24h למניעת spam

**אם נסיר:** The Registry לא יתעדכן אוטומטית — לא תואם מפרט.

---

## דף 8 — דגימות מסך (להצגה בזום)

| # | דף | מה להראות |
|---|-----|-----------|
| 1 | `/` | 3 שורות LoRa, תרשים זרימה, קישור מד"א, חלון הזהב 0–4 דק' |
| 2 | `/register` | הרשמה ללא סיסמה, דפי + LoRa, סוג משתתף |
| 3 | `/emergency` | הפעלת מצוקה, Geohash, מפה עם ~50 מכשירים, Hybrid Panel |
| 4 | `/volunteer` | Push, חלון אדום, Waze/Maps |
| 5 | `/fleet` | The Registry, DevEUI, ping שקט |
| 6 | `/lora-shops` | 4 חנויות 433MHz, הוראות Meshtastic |
| 7 | `/admin` | CMS, הרשמות, JWT refresh |

---

## דף 9 — סיכום התאמה למפרט

| דרישת מרצה | מימוש |
|-------------|--------|
| 2 שרתים + SQL + NoSQL + JWT | ✅ |
| Registration & Fleet | ✅ |
| Hybrid Alert (מדומה) | ✅ |
| Geo-fencing + Geohash | ✅ |
| The Registry + ping + תחזוקה | ✅ |
| Incident Logic + מוקד | ✅ |
| סימולטור WEB + 50 seed | ✅ |
| שיווק + עברית + אדמין CMS | ✅ |
| GitHub + README + ענן | ✅ |
| יישום מתנדב (volunteer) | ✅ |

**פרויקט לימודי — Pro Bono / אפקה 2026**
