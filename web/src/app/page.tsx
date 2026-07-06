import Link from 'next/link';
import FlowDiagram from '@/components/FlowDiagram';
import { fetchCmsPages, getCmsContent } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const cmsPages = await fetchCmsPages();

  const homeIntroRaw = getCmsContent(
    cmsPages,
    'home-intro',
    [
      'LoRa (Long Range) היא טכנולוגיית תקשורת רדיו המאפשרת להעביר נתונים למרחקים של קילומטרים רבים בצריכת חשמל נמוכה במיוחד, גם ללא רשת סלולרית או חיבור לאינטרנט.',
      'Meshtastic היא תוכנה הפועלת על גבי מכשירי LoRa והופכת אותם לרשת Mesh, שבה כל מכשיר יכול להעביר הודעות למכשירים אחרים וכך להרחיב את טווח התקשורת.',
      'בקריאת מצוקה, המערכת מאתרת את בעלי הדפיברילטורים הקרובים ביותר ושולחת אליהם התראה דרך רשת LoRa או באמצעות הטלפון, כדי לקצר את זמן ההגעה ולהגדיל את סיכויי ההצלה.',
    ].join('\n\n')
  );
  const loraParagraphs = homeIntroRaw.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  const cta = getCmsContent(
    cmsPages,
    'call-to-action',
    'הצטרפו למיזם! רשמו את הדפיברילטור הנייד שלכם, רכשו מכשיר LoRa בתדר 433MHz, והצילו חיים בשטח.'
  );
  const maintenance = getCmsContent(
    cmsPages,
    'maintenance',
    'בדקו סוללת LoRa פעם בשבוע. החליפו סוללות דפיברילטור לפי הוראות היצרן.'
  );
  const purchase = getCmsContent(
    cmsPages,
    'purchase',
    'רכשו מכשיר Meshtastic/LoRa בתדר 433MHz — ראו קישורים בדף חנויות LoRa.'
  );

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-l from-red-700 to-red-900 p-8 text-white shadow-xl">
        <h1 className="mb-4 text-3xl font-bold md:text-4xl">דפיברילטור בשטח — Pro Bono</h1>
        <p className="max-w-3xl text-lg leading-relaxed opacity-95">
          מיפוי דפיברילטורים <strong>ניידים</strong> בזמן אמת לרוכבי אופניים, מטיילים וקבוצות בשטח.
          משלים את{' '}
          <a
            href="https://defi.co.il/#/map"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-90"
          >
            איפה דפי
          </a>{' '}
          שממפה רק מכשירים <strong>נייחים</strong> ברשת סלולר.
        </p>
        <p className="mt-4 max-w-3xl rounded-lg bg-red-800/50 p-3 text-sm">{cta}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/emergency"
            className="rounded-lg bg-white px-6 py-3 font-bold text-red-800 shadow hover:bg-red-50"
          >
            סימולטור קריאת מצוקה
          </Link>
          <Link
            href="/register"
            className="rounded-lg border-2 border-white px-6 py-3 font-bold hover:bg-red-800"
          >
            הרשמה למיזם
          </Link>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold text-red-800">מה זה LoRa?</h2>
        <div className="space-y-4 leading-relaxed text-gray-800">
          {loraParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      <FlowDiagram />

      <section className="grid gap-4 md:grid-cols-3">
        <Card title=" 0–4 דק'" text="זהו חלון הזהב. מתן שוק חשמלי בפרק זמן זה מעניק את סיכויי ההישרדות הגבוהים ביותר (יכול להגיע ל-70% ואף יותר)."/>
        <Card title="4–10 דק'" text="בכל דקה שחולפת ללא דפיברילציה, סיכויי ההישרדות יורדים בכ-7% עד 10%. בשלב זה מתחיל להיווצר נזק מוחי בגלל חוסר בחמצן. " />
        <Card title="מעל 10 דק'" text="ללא החייאה (עיסויי חזה) ודפיברילציה, סיכויי ההישרדות נמוכים מאוד, אך המכשיר עדיין עשוי לעזור אם בוצעו עיסויים ששמרו על זרימת דם מינימלית ללב." />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow">
          <h2 className="mb-2 font-bold text-red-800">אחזקה</h2>
          <p className="text-sm text-gray-700">{maintenance}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow">
          <h2 className="mb-2 font-bold text-red-800">רכישה</h2>
          <p className="text-sm text-gray-700">{purchase}</p>
          <Link href="/lora-shops" className="mt-2 inline-block text-sm text-blue-700 underline">
            לחנויות LoRa 433MHz →
          </Link>
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-red-600 bg-red-50 p-4">
        <p className="font-bold">במצב חירום אמיתי: התקשרו 101 מיד.</p>
        <p className="text-sm">האתר הוא סימולטור לימודי — לא מחליף מוקד רפואי.</p>
      </section>
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-bold text-red-700">{title}</h3>
      <p className="mt-1 text-sm text-gray-700">{text}</p>
    </div>
  );
}
