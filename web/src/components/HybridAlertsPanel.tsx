type Props = {
  hybridAlerts: { pushSent: boolean; loraDownlinkSent: boolean; smsSimulated: boolean };
  pushTargetCount: number;
  loraDeviceCount: number;
  sourceLabel: string;
  beepPlayed: boolean;
};

function ChannelRow({
  active,
  title,
  desc,
  color,
}: {
  active: boolean;
  title: string;
  desc: string;
  color: 'green' | 'blue' | 'gray';
}) {
  const styles = {
    green: active ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-60',
    blue: active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60',
    gray: active ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50 opacity-60',
  };

  return (
    <div className={`rounded-lg border-2 p-3 ${styles[color]}`}>
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          {active ? '✓' : '—'}
        </span>
        <div>
          <div className="font-bold text-gray-900">{title}</div>
          <div className="text-sm text-gray-700">{desc}</div>
        </div>
      </div>
    </div>
  );
}

export default function HybridAlertsPanel({
  hybridAlerts,
  pushTargetCount,
  loraDeviceCount,
  sourceLabel,
  beepPlayed,
}: Props) {
  return (
    <section className="rounded-xl border-2 border-red-700 bg-gradient-to-l from-red-50 to-white p-5 shadow-md">
      <h2 className="text-lg font-bold text-red-900">אזעקה היברידית — Hybrid Alert System</h2>
      <p className="mt-1 text-sm text-gray-700">
        בקריאת מצוקה לבבית השרת מפעיל <strong>שני ערוצים במקביל</strong> — סלולר (Push/SMS) ו-LoRa
        Downlink — גם כשהטלפון של המתנדב כבוי או ללא קליטה.
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <ChannelRow
          active={hybridAlerts.pushSent}
          color="green"
          title="ערוץ סלולר — Push Notification"
          desc={
            hybridAlerts.pushSent
              ? `נשלח ל-${pushTargetCount} מחזיקי דפיברילטור ברדיוס`
              : 'לא נשלח'
          }
        />
        <ChannelRow
          active={hybridAlerts.smsSimulated}
          color="gray"
          title="ערוץ סלולר — SMS"
          desc={
            hybridAlerts.smsSimulated
              ? `SMS נשלח — מקור: ${sourceLabel}`
              : 'לא פעיל (הזינו טלפון מדווח או בחרו מוקד 101 / טלפון)'
          }
        />
        <ChannelRow
          active={hybridAlerts.loraDownlinkSent}
          color="blue"
          title="ערוץ LoRa — Downlink"
          desc={
            hybridAlerts.loraDownlinkSent
              ? `צפצוף/הבהוב ל-${loraDeviceCount} מכשירי LoRa${beepPlayed ? ' — 3 ביפים' : ''}`
              : 'אין מכשירי LoRa ברדיוס'
          }
        />
      </div>

      <p className="mt-4 rounded-lg bg-white/80 px-3 py-2 text-xs text-gray-600">
        בחירום אמיתי:{' '}
        <a href="tel:101" className="font-bold text-red-700 underline">
          התקשרו 101
        </a>{' '}
        |{' '}
        <a
          href="https://defi.co.il/#/map"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-700 underline"
        >
          איפה דפי (מד&quot;א)
        </a>
      </p>
    </section>
  );
}
