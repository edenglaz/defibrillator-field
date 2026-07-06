'use client';

import { useEffect, useState } from 'react';
import { SIM_API, fetchJson } from '@/lib/api';

type Incident = {
  _id: string;
  lat: number;
  lon: number;
  source: string;
  status: string;
  distressGeohash?: string;
  radiusMeters: number;
  reporterPhone?: string;
  createdAt: string;
  dispatchReports?: {
    message: string;
    volunteerName?: string;
    distanceMeters?: number;
    etaSeconds?: number;
    createdAt: string;
  }[];
  volunteerResponses?: {
    ownerName: string;
    distanceMeters?: number;
    etaSeconds?: number;
    accepted: boolean;
  }[];
};

export default function DispatchPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await fetchJson<Incident[]>(`${SIM_API}/simulator/incidents`);
      setIncidents(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה בטעינה');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  async function resolve(id: string) {
    try {
      await fetchJson(`${SIM_API}/simulator/incidents/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'טיפול הושלם — סימולציה' }),
      });
      setMsg('אירוע נסגר');
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    }
  }

  const statusLabel: Record<string, string> = {
    open: 'פתוח',
    volunteers_notified: 'מתנדבים קיבלו התראה',
    volunteer_en_route: 'מתנדב בדרך',
    resolved: 'נסגר',
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border-2 border-blue-700 bg-blue-50 p-6">
        <h1 className="text-2xl font-bold text-blue-900">מוקד / דיווח — Dispatch Center</h1>
        <p className="mt-2 text-gray-700">
          מסך זה מדמה את עדכון המוקד (101): מתנדב בדרך, מרחק מהיעד, וסגירת אירוע.
          מתעדכן אוטומטית כל 10 שניות. סטטוס מכשירים (סוללה, תקינות) —{' '}
          <a href="/fleet" className="text-orange-700 underline">
            מאגר מכשירים
          </a>
          .
        </p>
      </section>

      {msg && <p className="rounded bg-green-100 p-3 text-green-800">{msg}</p>}

      {loading && incidents.length === 0 ? (
        <p>טוען אירועים...</p>
      ) : incidents.length === 0 ? (
        <p className="rounded border bg-white p-4 text-gray-600">
          אין אירועים עדיין. הפעילו קריאת מצוקה בדף{' '}
          <a href="/emergency" className="text-red-700 underline">
            קריאת מצוקה
          </a>
          .
        </p>
      ) : (
        <ul className="space-y-4">
          {incidents.map((inc) => (
            <li key={inc._id} className="rounded-xl border bg-white p-4 shadow">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-red-800">
                    אירוע #{inc._id.slice(-6)}
                  </span>
                  <span className="mr-2 rounded bg-gray-100 px-2 py-0.5 text-xs">
                    {statusLabel[inc.status] || inc.status}
                  </span>
                  <span className="mr-2 text-xs text-gray-500">מקור: {inc.source}</span>
                </div>
                {inc.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => resolve(inc._id)}
                    className="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-800"
                  >
                    סגור אירוע
                  </button>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-600">
                מיקום: {inc.lat.toFixed(4)}, {inc.lon.toFixed(4)} | רדיוס: {inc.radiusMeters} מ&apos;
                {inc.distressGeohash && ` | Geohash: ${inc.distressGeohash}`}
              </p>

              {inc.volunteerResponses && inc.volunteerResponses.length > 0 && (
                <div className="mt-3 rounded bg-green-50 p-3">
                  <h3 className="font-bold text-green-800">מתנדבים שאישרו הגעה</h3>
                  <ul className="mt-1 space-y-1 text-sm">
                    {inc.volunteerResponses.map((v, i) => (
                      <li key={i}>
                        {v.ownerName} — {v.distanceMeters ?? '?'} מ&apos;
                        {v.etaSeconds != null && ` | ETA ~${Math.round(v.etaSeconds / 60)} דק'`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {inc.dispatchReports && inc.dispatchReports.length > 0 && (
                <div className="mt-3">
                  <h3 className="font-bold text-blue-800">דיווחים למוקד</h3>
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    {inc.dispatchReports.map((r, i) => (
                      <li key={i} className="border-r-2 border-blue-300 pr-2">
                        {r.message}
                        <span className="mr-2 text-xs text-gray-400">
                          {new Date(r.createdAt).toLocaleString('he-IL')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
