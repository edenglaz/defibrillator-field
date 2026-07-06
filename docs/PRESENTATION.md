# שקף הגנה — דפיברילטור בשטח Pro Bono

---

## דף 1 — פרטי הפרויקט

| | |
|---|---|
| **שמות המבצעים** | [מלא שם] / [מלא שם] |
| **GitHub** | https://github.com/[username]/defibrillator-field |
| **ענן (אם הועלה)** | [URL] |

---

## דף 2 — Known Bugs / בעיות ידועות

1. **Push / LoRa / SMS** — מדומים בלבד (אין חומרה Meshtastic).
2. **OSRM** — API ציבורי; לפעמים fallback לקו ישר.
3. **Breadcrumbs** — מיושם via OSRM אופניים, לא API רשמי של עמי ותמי.
4. **מפות Offline** — סימולציית Cache, לא PWA אמיתי.
5. **In-Memory MongoDB** — נתונים מתאפסים בהפעלה מחדש (אם אין MongoDB מקומי).

---

## דף 3 — ארכיטקטורה

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Next.js    │────▶│  Server 1 (3001) │────▶│  SQLite (CMS/Auth)  │
│  web :3000  │     │  Express + JWT   │     │  admins, cms_pages  │
└──────┬──────┘     └──────────────────┘     └─────────────────────┘
       │
       └──────────▶┌──────────────────┐     ┌─────────────────────┐
                   │  Server 2 (3002) │────▶│  MongoDB (Fleet)    │
                   │  Geohash+Sim     │     │  devices, incidents │
                   └──────────────────┘     └─────────────────────┘
```

**E2E:** זיהוי → Geohash → Geo-fencing → Push+LoRa → OSRM → דיווח מוקד

---

## דף 4 — קטעי קוד חשובים

| קובץ | תפקיד |
|------|--------|
| `simulator-server/utils/geohash.js` | Geohash encode + neighbor search |
| `simulator-server/routes/distress.js` | סימולטור מצוקה + דיווח למוקד |
| `server/routes/auth.js` | JWT Access 15m + Refresh 7d |
| `web/src/lib/api.ts` | authFetch — רענון JWT אוטומטי |
| `web/src/app/page.tsx` | CMS מהאדמין מוצג בדף הבית |

---

## דף 5 — דגימות מסך

- `/` — LoRa + CMS + תרשים זרימה
- `/emergency` — סימולטור + Geohash + מפה Offline
- `/dispatch` — מוקד 101 (דיווח מתנדב)
- `/register` — הרשמה → צי מכשירים
- `/admin` — CMS (micha / 1234)
