'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { SIM_API, fetchJson } from '@/lib/api';
import { wazeNavUrl, googleMapsNavUrl } from '@/lib/navigationLinks';
import {
  loadLoRaDistressCache,
  markBluetoothMeshtasticReceived,
  saveLoRaDistressCache,
  type LoRaDistressCache,
} from '@/lib/loraOfflineCache';
import {
  playEmergencyPushAlert,
  requestNotificationPermission,
  showDistressNotification,
} from '@/lib/mobileAlert';
import {
  payloadToIncident,
  readVolunteerAlert,
  subscribeVolunteerAlert,
  type VolunteerAlertPayload,
} from '@/lib/volunteerAlertSignal';

const DistressMap = dynamic(() => import('@/components/DistressMap'), { ssr: false });

type Device = {
  _id: string;
  ownerName: string;
  lat: number;
  lon: number;
  hasLora: boolean;
};

type Incident = {
  _id: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  status: string;
  createdAt: string;
};

const DISMISS_KEY = 'volunteerDismissedIncidents';

export default function VolunteerAppPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [bluetoothConnected, setBluetoothConnected] = useState(false);
  const [alert, setAlert] = useState<Incident | null>(null);
  const [loraCache, setLoraCache] = useState<LoRaDistressCache | null>(null);
  const [notifOk, setNotifOk] = useState(false);
  const [msg, setMsg] = useState('');
  const seenRef = useRef<Set<string>>(new Set());
  const dismissedRef = useRef<Set<string>>(new Set());
  const alertPlayingRef = useRef(false);
  const initializedRef = useRef(false);
  const lastHandledTsRef = useRef(0);
  const mountedAtRef = useRef(Date.now());

  const selected = devices.find((d) => d._id === deviceId);

  const dismissAlert = useCallback(() => {
    if (alert) {
      dismissedRef.current.add(alert._id);
      try {
        sessionStorage.setItem(
          DISMISS_KEY,
          JSON.stringify(Array.from(dismissedRef.current))
        );
      } catch {
        /* ignore */
      }
    }
    setAlert(null);
  }, [alert]);

  const fireAlert = useCallback((inc: Incident) => {
    if (dismissedRef.current.has(inc._id)) return;

    setAlert(inc);
    saveLoRaDistressCache({
      incidentId: inc._id,
      lat: inc.lat,
      lon: inc.lon,
      radiusMeters: inc.radiusMeters,
    });
    setLoraCache(loadLoRaDistressCache());

    if (!alertPlayingRef.current) {
      alertPlayingRef.current = true;
      playEmergencyPushAlert();
      showDistressNotification(
        '🚨 קריאת מצוקה — דפיברילטור בשטח',
        `אירוע לבבי ב-${inc.lat.toFixed(4)}, ${inc.lon.toFixed(4)}. לחץ לאישור הגעה.`
      );
      setTimeout(() => {
        alertPlayingRef.current = false;
      }, 3000);
    }
  }, []);

  const processPayload = useCallback(
    (payload: VolunteerAlertPayload) => {
      if (payload.ts <= lastHandledTsRef.current) return;
      if (dismissedRef.current.has(payload.incidentId)) return;
      lastHandledTsRef.current = payload.ts;
      seenRef.current.add(payload.incidentId);
      fireAlert(payloadToIncident(payload));
    },
    [fireAlert]
  );

  const checkPendingAlert = useCallback(() => {
    const payload = readVolunteerAlert();
    if (payload) processPayload(payload);
  }, [processPayload]);

  const handleIncomingAlert = useCallback(
    (inc: Incident) => {
      if (dismissedRef.current.has(inc._id) || seenRef.current.has(inc._id)) return;
      seenRef.current.add(inc._id);
      fireAlert(inc);
    },
    [fireAlert]
  );

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DISMISS_KEY);
      if (saved) {
        for (const id of JSON.parse(saved) as string[]) {
          dismissedRef.current.add(id);
        }
      }
    } catch {
      /* ignore */
    }

    fetchJson<Incident[]>(`${SIM_API}/simulator/incidents`)
      .then((incidents) => {
        const unresolved = incidents.filter((i) => i.status !== 'resolved');
        const pending = readVolunteerAlert();
        for (const i of unresolved) {
          const isPending =
            pending && String(pending.incidentId) === String(i._id);
          const isNew = new Date(i.createdAt).getTime() >= mountedAtRef.current - 5000;
          if (!isPending && !isNew) {
            seenRef.current.add(i._id);
          }
        }
        initializedRef.current = true;
        checkPendingAlert();
      })
      .catch(() => {
        initializedRef.current = true;
      });
  }, [checkPendingAlert]);

  useEffect(() => {
    fetchJson<Device[]>(`${SIM_API}/devices`)
      .then((list) => {
        setDevices(list);
        if (list[0]) setDeviceId(list[0]._id);
      })
      .catch(() => {});
    setLoraCache(loadLoRaDistressCache());
  }, []);

  useEffect(() => {
    checkPendingAlert();
    const unsub = subscribeVolunteerAlert(processPayload);

    const onVisible = () => {
      if (document.visibilityState === 'visible') checkPendingAlert();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', checkPendingAlert);

    const poll = async () => {
      if (!initializedRef.current) return;
      try {
        const incidents = await fetchJson<Incident[]>(`${SIM_API}/simulator/incidents`);
        const active = incidents.find(
          (i) =>
            i.status !== 'resolved' &&
            !seenRef.current.has(i._id) &&
            !dismissedRef.current.has(i._id)
        );
        if (active) handleIncomingAlert(active);
      } catch {
        /* ignore */
      }
    };
    poll();
    const pollInterval = setInterval(poll, 2000);
    const signalInterval = setInterval(checkPendingAlert, 1000);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', checkPendingAlert);
      clearInterval(signalInterval);
      clearInterval(pollInterval);
    };
  }, [handleIncomingAlert, checkPendingAlert, processPayload]);

  async function enableNotifications() {
    const ok = await requestNotificationPermission();
    setNotifOk(ok);
    setMsg(
      ok
        ? 'הרשאת Push אושרה — החלון יקפוץ אוטומטית אחרי הפעלת מצוקה'
        : 'לא ניתן להפעיל התראות — אשרו בהגדרות הדפדפן'
    );
    checkPendingAlert();
  }

  function connectBluetoothMeshtastic() {
    setBluetoothConnected(true);
    markBluetoothMeshtasticReceived();
    setLoraCache(loadLoRaDistressCache());
    setMsg('מחובר ל-Meshtastic דרך Bluetooth — מיקום מצוקה התקבל מרשת LoRa');
  }

  async function acceptArrival() {
    if (!alert || !selected) return;
    try {
      await fetchJson(`${SIM_API}/simulator/incidents/${alert._id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selected._id, accepted: true }),
      });
      window.open(wazeNavUrl(alert.lat, alert.lon), '_blank');
      window.open(
        googleMapsNavUrl(selected.lat, selected.lon, alert.lat, alert.lon),
        '_blank'
      );
      dismissedRef.current.add(alert._id);
      setAlert(null);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'שגיאה');
    }
  }

  function declineArrival() {
    dismissAlert();
  }

  function resetDismissedAlerts() {
    dismissedRef.current.clear();
    try {
      sessionStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
    setMsg('התראות שנדחו אופסו — הפעילי מצוקה מחדש');
  }

  const mapCenter = offlineMode && loraCache
    ? { lat: loraCache.lat, lon: loraCache.lon }
    : alert
      ? { lat: alert.lat, lon: alert.lon }
      : selected
        ? { lat: selected.lat, lon: selected.lon }
        : { lat: 32.0853, lon: 34.7818 };

  const showMap = (offlineMode && loraCache) || alert;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <section className="rounded-xl border-2 border-purple-700 bg-purple-50 p-5">
        <h1 className="text-xl font-bold text-purple-900">יישום סלולרי — מתנדב</h1>
        <p className="mt-2 text-sm text-gray-700">
          WEB responsive המדמה אפליקציית מתנדב: Push רועש (עוקף &quot;נא לא להפריע&quot;), ניווט
          Waze/Maps, וגיבוי LoRa + Meshtastic + מפות Offline.
        </p>
      </section>

      <div className="space-y-3 rounded-xl border bg-white p-4 shadow">
        <label className="block text-sm">
          זהות מתנדב (סימולציה)
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-2"
          >
            {devices.map((d) => (
              <option key={d._id} value={d._id}>
                {d.ownerName}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={enableNotifications}
          className="w-full rounded-lg bg-purple-700 py-2 text-sm font-bold text-white"
        >
          {notifOk ? '✓ הרשאת Push פעילה' : 'אשר הרשאת Push (דפדפן)'}
        </button>

        <button
          type="button"
          onClick={resetDismissedAlerts}
          className="w-full rounded border border-gray-300 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          איפוס התראות שנדחו (אם לא קופץ חלון)
        </button>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={(e) => setOfflineMode(e.target.checked)}
          />
          מצב ללא קליטה — מפות Offline (Cache)
        </label>

        {offlineMode && (
          <button
            type="button"
            onClick={connectBluetoothMeshtastic}
            className={`w-full rounded-lg py-2 text-sm font-bold text-white ${
              bluetoothConnected ? 'bg-green-700' : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {bluetoothConnected
              ? '✓ Meshtastic מחובר (Bluetooth)'
              : 'התחבר ל-LoRa דרך Bluetooth (Meshtastic)'}
          </button>
        )}

        {loraCache && offlineMode && (
          <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">
            מיקום מצוקה מ-LoRa: {loraCache.lat.toFixed(4)}, {loraCache.lon.toFixed(4)}
            {loraCache.via === 'bluetooth_meshtastic' ? ' (Bluetooth)' : ' (Mesh)'}
          </p>
        )}
      </div>

      {showMap && (
        <DistressMap
          center={mapCenter}
          radiusMeters={loraCache?.radiusMeters ?? alert?.radiusMeters ?? 500}
          devices={
            selected
              ? [
                  {
                    _id: selected._id,
                    ownerName: selected.ownerName,
                    lat: selected.lat,
                    lon: selected.lon,
                    hasDefibrillator: true,
                    hasLora: selected.hasLora,
                  },
                ]
              : []
          }
          distressLabel="מיקום קריאת מצוקה (LoRa/Offline)"
          offlineMode={offlineMode}
        />
      )}

      {msg && <p className="rounded bg-green-100 p-2 text-sm text-green-800">{msg}</p>}

      {alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/95 p-4">
          <div className="w-full max-w-sm rounded-2xl border-4 border-white bg-red-700 p-6 text-center text-white shadow-2xl">
            <p className="text-3xl font-black">🚨</p>
            <h2 className="mt-2 text-2xl font-bold">קריאת מצוקה!</h2>
            <p className="mt-3 text-sm">
              התראת אמת — מתגברת על &quot;נא לא להפריע&quot;
              <br />
              אירוע לבבי בקרבתך
            </p>
            <p className="mt-2 font-mono text-xs opacity-90">
              {alert.lat.toFixed(4)}, {alert.lon.toFixed(4)}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={acceptArrival}
                className="rounded-xl bg-white py-4 text-lg font-bold text-red-800"
              >
                מאשר/ת הגעה + ניווט
              </button>
              <button
                type="button"
                onClick={declineArrival}
                className="rounded-lg border border-white/50 py-2 text-sm"
              >
                סגור (לא זמין/ת)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
