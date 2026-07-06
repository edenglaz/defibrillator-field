'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SIM_API, fetchJson } from '@/lib/api';
import { formatLastPing, formatLastPingShort } from '@/lib/format';
import { batteryLevelClass, healthBadgeClass, healthLabel } from '@/lib/deviceStatus';

type Device = {
  _id: string;
  devEui?: string;
  ownerName: string;
  phone: string;
  hasDefibrillator: boolean;
  hasLora: boolean;
  batteryPercent: number;
  loraBatteryPercent: number;
  isHealthy: boolean;
  lastPingAt: string;
  lat: number;
  lon: number;
};

type FleetSummary = {
  total: number;
  withDefibrillator: number;
  withLora: number;
  healthy: number;
  unhealthy: number;
  lowDefibBattery: number;
  lowLoraBattery: number;
  activeLoRaPings: number;
  pingIntervalMinutes: number;
};

type MaintenancePush = {
  _id: string;
  message: string;
  createdAt: string;
};

export default function FleetPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [pushes, setPushes] = useState<MaintenancePush[]>([]);
  const [loading, setLoading] = useState(true);
  const [pingMsg, setPingMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'healthy' | 'unhealthy' | 'low_battery'>('all');

  async function load() {
    try {
      const [devs, sum, pushList] = await Promise.all([
        fetchJson<Device[]>(`${SIM_API}/devices`),
        fetchJson<FleetSummary>(`${SIM_API}/devices/fleet-summary`),
        fetchJson<MaintenancePush[]>(`${SIM_API}/devices/maintenance-pushes`).catch(() => []),
      ]);
      setDevices(devs);
      setSummary(sum);
      setPushes(pushList);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  async function triggerPing() {
    setPingMsg('');
    try {
      const res = await fetchJson<{ updated: number; pushes: number; message: string }>(
        `${SIM_API}/devices/trigger-ping`,
        { method: 'POST' }
      );
      setPingMsg(`${res.message} — ${res.updated} מכשירים, ${res.pushes} Push תחזוקה`);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'שגיאה';
      setPingMsg(
        msg === 'Not Found' || msg.includes('404')
          ? 'השרת לא מעודכן — הפעילו מחדש: cd simulator-server && npm start'
          : msg
      );
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = devices.filter((d) => {
    if (filter === 'healthy') return d.isHealthy;
    if (filter === 'unhealthy') return !d.isHealthy;
    if (filter === 'low_battery') {
      return (
        (d.hasDefibrillator && d.batteryPercent < 20) ||
        (d.hasLora && d.loraBatteryPercent < 20)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border-2 border-orange-600 bg-orange-50 p-6">
        <h1 className="text-2xl font-bold text-orange-900">מאגר מכשירים — The Registry</h1>
        <p className="mt-2 text-gray-700">
          The Registry — שם, סלולאר, עם/בלי LoRa. עדכון שקט: ציוץ LoRa פעם בשעה (GPS + סוללה).
          התראות תחזוקה: Push אוטומטי כשסוללה &lt; 20%. ראו{' '}
          <Link href="/dispatch" className="text-blue-700 underline">
            ניהול אירוע (מוקד)
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={triggerPing}
          className="mt-3 rounded bg-orange-700 px-4 py-2 text-sm text-white hover:bg-orange-800"
        >
          הפעל עדכון שקט LoRa עכשיו
        </button>
        {pingMsg && <p className="mt-2 text-sm text-green-800">{pingMsg}</p>}
      </section>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="סה״כ מכשירים" value={summary.total} />
          <StatCard label="תקינים" value={summary.healthy} color="text-green-700" />
          <StatCard label="לא תקינים" value={summary.unhealthy} color="text-red-700" />
          <StatCard
            label="שידור LoRa פעיל"
            value={`${summary.activeLoRaPings}/${summary.withLora}`}
            color="text-blue-700"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['all', 'הכל'],
            ['healthy', 'תקינים'],
            ['unhealthy', 'לא תקינים'],
            ['low_battery', 'סוללה נמוכה'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded px-3 py-1 text-sm ${
              filter === key ? 'bg-orange-700 text-white' : 'border bg-white text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
        <span className="self-center text-xs text-gray-500">
          עדכון אוטומטי כל {summary?.pingIntervalMinutes ?? 60} דק&apos; | רענון תצוגה כל 30 שנ&apos;
        </span>
      </div>

      {pushes.length > 0 && (
        <section className="rounded-lg border border-blue-300 bg-blue-50 p-4">
          <h2 className="font-bold text-blue-900">Push תחזוקה אחרונים</h2>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-sm">
            {pushes.slice(0, 10).map((p) => (
              <li key={p._id}>
                {p.message}
                <span className="mr-2 text-xs text-gray-400">
                  {new Date(p.createdAt).toLocaleString('he-IL')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {loading ? (
        <p>טוען צי...</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow">
          <table className="w-full min-w-[860px] text-right text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="p-3">בעלים</th>
                <th className="p-3">DevEUI / LoRa ID</th>
                <th className="p-3">דפיברילטור</th>
                <th className="p-3">סטטוס</th>
                <th className="p-3">סוללת דפי</th>
                <th className="p-3">סוללת LoRa</th>
                <th className="p-3">שידור אחרון</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{d.ownerName}</td>
                  <td className="p-3 font-mono text-xs" dir="ltr">
                    {d.devEui || '—'}
                  </td>
                  <td className="p-3">{d.hasDefibrillator ? '✓' : '—'}</td>
                  <td className="p-3">
                    {d.hasDefibrillator ? (
                      <span className={healthBadgeClass(d.isHealthy)}>{healthLabel(d.isHealthy)}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`p-3 ${batteryLevelClass(d.batteryPercent)}`}>
                    {d.hasDefibrillator ? `${d.batteryPercent}%` : '—'}
                  </td>
                  <td className={`p-3 ${d.hasLora ? batteryLevelClass(d.loraBatteryPercent) : ''}`}>
                    {d.hasLora ? `${d.loraBatteryPercent}%` : '—'}
                  </td>
                  <td className="p-3 text-gray-600" title={formatLastPingShort(d.lastPingAt)}>
                    {d.hasLora ? formatLastPing(d.lastPingAt) : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    אין מכשירים בפילטר זה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = 'text-gray-900',
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
