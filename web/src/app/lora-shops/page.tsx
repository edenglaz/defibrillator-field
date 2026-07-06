import Link from 'next/link';

const shops = [
  {
    name: 'AliExpress — Meshtastic / LoRa 433MHz',
    url: 'https://www.aliexpress.com/w/wholesale-meshtastic-433.html',
    note: 'חפשו "Meshtastic 433" או "LoRa 433MHz" — ודאו תדר 433 לישראל.',
  },
  {
    name: 'Amazon — LoRa Meshtastic modules',
    url: 'https://www.amazon.com/s?k=meshtastic+lora+433',
    note: 'מודולים עם SX1262/SX1276 בתדר EU433 / 433MHz.',
  },
  {
    name: 'Meshtastic.org — רשמי',
    url: 'https://meshtastic.org/docs/getting-started/',
    note: 'הוראות קונפיגורציה, רשימת חומרה מומלצת, קהילה.',
  },
  {
    name: 'Tindie / LilyGO (EU433)',
    url: 'https://www.tindie.com/stores/lilygo/',
    note: 'LilyGO T-Beam / T-Echo — פופולריים בקהילת Meshtastic.',
  },
];

const setupSteps = [
  {
    step: 1,
    title: 'רכישת מכשיר LoRa בתדר 433MHz',
    text: 'בחרו מודול Meshtastic (LilyGO T-Beam, T-Echo וכו\') בתדר ISM 433MHz. עלות משוערת ~50$ (Pro Bono).',
  },
  {
    step: 2,
    title: 'קונפיגורציה ב-Meshtastic',
    text: 'חברו ב-Bluetooth לאפליקציית Meshtastic. הגדירו Region: EU433, הפעילו GPS, וקבעו שם מכשיר — זהו ה-LoRa ID בהרשמה.',
  },
  {
    step: 3,
    title: 'הצמדה לדפיברילטור',
    text: 'הצמידו את מכשיר ה-LoRa לתיק/נרתיק הדפיברילטור הנייד. ודאו שה-GPS פונה לשמיים בשטח.',
  },
  {
    step: 4,
    title: 'רישום באתר',
    text: 'הירשמו בדף הרשמה — שם וטלפון נייד בלבד (ללא סיסמה), סמנו דפיברילטור ו/או LoRa, והזינו את ה-LoRa ID.',
  },
  {
    step: 5,
    title: 'עדכון שקט אוטומטי',
    text: 'המכשיר שולח ציוץ LoRa פעם בשעה עם מיקום GPS ומצב סוללה. השרת מעדכן את ה-Registry ללא התערבות אנושית.',
  },
  {
    step: 6,
    title: 'תחנת LoRa קבועה (בעלי בתים בשטח)',
    text: 'ניתן להפעיל Meshtastic קבוע מהבית באזורי טבע — צריכת חשמל מזערית. מרחיב את רשת ה-Mesh Ad-Hoc לכל הקהילה.',
  },
];

export default function LoraShopsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-red-800">רכישת מכשיר LoRa — תדר 433MHz</h1>
        <p className="mt-2 leading-relaxed text-gray-700">
          לפי דרישות משרד התקשורת בישראל, השתמשו ב<strong>תדר 433MHz</strong> (ISM). Meshtastic
          הופכת את המכשיר לרשת Mesh מוצפנת — ממסר, GPS, Bluetooth לסמארטפון.
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <p className="font-bold">מתנדבים להגברת הרשת (~50$ Pro Bono)</p>
        <p className="mt-1 text-sm text-gray-700">
          נשאי LoRa ברכישה עצמית — מדריכים, מטיילים, רוכבי אופניים ואופנועים, חובבי טבע — וגם
          בעלי בתים באזורי טבע עם תחנה קבועה. הרשת היא רשת רדיו Ad-Hoc שמוקמת אונליין בשטח.
        </p>
      </div>

      <section className="rounded-xl border-2 border-blue-700 bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-blue-900">הוראות קונפיגורציה — מהרכישה ועד שידור</h2>
        <p className="mt-2 text-sm text-gray-700">
          בעלי דפיברילטורים: רכשו LoRa, הצמידו לדפיברילטור, הגדירו Meshtastic, והירשמו באתר.
        </p>
        <ol className="mt-4 space-y-4">
          {setupSteps.map((s) => (
            <li key={s.step} className="flex gap-3 rounded-lg border bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                {s.step}
              </span>
              <div>
                <h3 className="font-bold text-blue-900">{s.title}</h3>
                <p className="mt-1 text-sm text-gray-700">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/register" className="mt-4 inline-block text-sm font-bold text-red-700 underline">
          → להרשמה באתר
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-red-800">קישורי רכישה</h2>
        <ul className="space-y-4">
          {shops.map((s) => (
            <li key={s.url} className="rounded-xl border bg-white p-5 shadow-sm">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-blue-700 hover:underline"
              >
                {s.name} ↗
              </a>
              <p className="mt-2 text-sm text-gray-600">{s.note}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
