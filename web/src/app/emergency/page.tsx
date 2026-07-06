'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { SIM_API, fetchJson } from '@/lib/api';
import { formatLastPing, formatLastPingShort } from '@/lib/format';
import { playLoRaDownlinkBeep } from '@/lib/alertSounds';
import { saveLoRaDistressCache } from '@/lib/loraOfflineCache';
import { broadcastVolunteerAlert } from '@/lib/volunteerAlertSignal';
import { wazeNavUrl, googleMapsNavUrl } from '@/lib/navigationLinks';
import { medicalTrainingLabel } from '@/lib/medicalTraining';
import { batteryLevelClass, healthBadgeClass, healthLabel } from '@/lib/deviceStatus';
import HybridAlertsPanel from '@/components/HybridAlertsPanel';
import type { MapDevice } from '@/components/DistressMap';

const DistressMap = dynamic(() => import('@/components/DistressMap'), { ssr: false });

type Volunteer = MapDevice & {
  deviceId: string;
  batteryPercent: number;
  loraBatteryPercent?: number;
  isHealthy?: boolean;
  medicalTraining?: string;
};

type DistressResponse = {
  incidentId: string;
  distress: { lat: number; lon: number; radiusMeters: number; source?: string; geohash?: string };
  hybridAlerts: { pushSent: boolean; loraDownlinkSent: boolean; smsSimulated: boolean };
  devicesInRadius: number;
  defibrillatorsAvailable: number;
  volunteers: Volunteer[];
  allNearby: MapDevice[];
  message: string;
};

type DispatchReport = {
  message: string;
  volunteerName?: string;
  distanceMeters?: number;
  etaSeconds?: number;
};

const SOURCE_OPTIONS = [
  { value: 'simulator', label: 'סימולטור WEB' },
  { value: 'app', label: 'אפליקציית אזרח' },
  { value: '101', label: 'מוקד 101' },
  { value: 'phone', label: 'טלפון / SMS' },
];

export default function EmergencyPage() {
  const [lat, setLat] = useState(32.0853);
  const [lon, setLon] = useState(34.7818);
  const [radius, setRadius] = useState(3000);
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('simulator');
  const [offlineMode, setOfflineMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DistressResponse | null>(null);
  const [dispatchReport, setDispatchReport] = useState<DispatchReport | null>(null);
  const [error, setError] = useState('');
  const [beepPlayed, setBeepPlayed] = useState(false);

  async function triggerDistress() {
    setLoading(true);
    setError('');
    setDispatchReport(null);
    setBeepPlayed(false);
    try {
      const data = await fetchJson<DistressResponse>(`${SIM_API}/simulator/distress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat,
          lon,
          radiusMeters: radius,
          source,
          reporterPhone: phone,
          repositionDevices: true,
        }),
      });
      setResult(data);
      saveLoRaDistressCache({
        incidentId: data.incidentId,
        lat: data.distress.lat,
        lon: data.distress.lon,
        radiusMeters: data.distress.radiusMeters,
      });
      broadcastVolunteerAlert({
        incidentId: data.incidentId,
        lat: data.distress.lat,
        lon: data.distress.lon,
        radiusMeters: data.distress.radiusMeters,
      });
      if (data.hybridAlerts.loraDownlinkSent) {
        playLoRaDownlinkBeep();
        setBeepPlayed(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setLoading(false);
    }
  }

  async function acceptVolunteer(deviceId: string, incidentId: string, vLat: number, vLon: number, dLat: number, dLon: number) {
    try {
      const nav = await fetchJson<{
        navigationUrl: string;
        wazeUrl?: string;
        googleMapsUrl?: string;
        dispatchReport: DispatchReport;
        breadcrumbsNote?: string;
      }>(`${SIM_API}/simulator/incidents/${incidentId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, accepted: true }),
      });
      setDispatchReport(nav.dispatchReport);
      window.open(nav.wazeUrl || wazeNavUrl(dLat, dLon), '_blank');
      window.open(nav.googleMapsUrl || googleMapsNavUrl(vLat, vLon, dLat, dLon), '_blank');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'שגיאה');
    }
  }

  const mapDevices: MapDevice[] = result
    ? (() => {
        const routeByDevice = new Map(
          result.volunteers.map((v) => [String(v.deviceId), v.route])
        );
        return result.allNearby.map((d) => ({
          _id: String(d._id),
          ownerName: d.ownerName,
          lat: d.lat,
          lon: d.lon,
          hasDefibrillator: Boolean(d.hasDefibrillator),
          hasLora: Boolean(d.hasLora),
          distanceMeters: d.distanceMeters,
          lastPingAt: d.lastPingAt,
          batteryPercent: d.batteryPercent,
          loraBatteryPercent: d.loraBatteryPercent,
          isHealthy: d.isHealthy,
          route: routeByDevice.get(String(d._id)),
        }));
      })()
    : [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-red-600 bg-red-50 p-6">
        <h1 className="text-2xl font-bold text-red-800">קריאת מצוקה — סימולטור</h1>
        <p className="mt-2 text-gray-700">
          סימולטור להדגמת קריאת מצוקה: המערכת מוצאת דפיברילטורים קרובים ושולחת התראה למתנדבים.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border bg-white p-4 shadow md:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          מקור הקריאה
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          קו רוחב (Lat)
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block text-sm">
          קו אורך (Lon)
          <input
            type="number"
            step="0.0001"
            value={lon}
            onChange={(e) => setLon(Number(e.target.value))}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block text-sm">
          רדיוס (מטר)
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="block text-sm">
          טלפון מדווח (SMS מדומה)
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05xxxxxxxx"
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="flex items-end gap-2 text-sm">
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={(e) => setOfflineMode(e.target.checked)}
            className="h-4 w-4"
          />
          מצב Offline — מפת Cache (Meshtastic)
        </label>
      </div>

      <button
        type="button"
        onClick={triggerDistress}
        disabled={loading}
        className="w-full rounded-xl bg-red-700 py-4 text-lg font-bold text-white shadow-lg hover:bg-red-800 disabled:opacity-50"
      >
        {loading ? 'מחפש מתנדבים...' : 'הפעל קריאת מצוקה (סימולציה)'}
      </button>

      {error && <p className="rounded bg-red-100 p-3 text-red-800">{error}</p>}

      {result && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <Stat label="בתוך הרדיוס" value={result.devicesInRadius} />
            <Stat label="עם דפיברילטור" value={result.defibrillatorsAvailable} />
          </div>
          <HybridAlertsPanel
            hybridAlerts={result.hybridAlerts}
            pushTargetCount={result.defibrillatorsAvailable}
            loraDeviceCount={result.volunteers.filter((v) => v.hasLora).length}
            sourceLabel={SOURCE_OPTIONS.find((o) => o.value === source)?.label ?? source}
            beepPlayed={beepPlayed}
          />

          {result.distress.geohash && (
            <div className="rounded-lg border-2 border-green-600 bg-green-50 p-4 text-sm">
              <h3 className="font-bold text-green-900">Geo-fencing — Real-time Backend</h3>
              <p className="mt-1 text-gray-700">
                השרת סרק את בסיס הנתונים ושלף {result.devicesInRadius} מכשירים ברדיוס{' '}
                {result.distress.radiusMeters} מ&apos;. Geohash:{' '}
                <code className="rounded bg-white px-1">{result.distress.geohash}</code>
              </p>
              <p className="mt-1 text-gray-600">
                דירוג זמינות: מתעדף מכשירים עם שידור LoRa עדכני + מרחק מהקריאה.
              </p>
            </div>
          )}

          <DistressMap
            center={result.distress}
            radiusMeters={result.distress.radiusMeters}
            devices={mapDevices}
            offlineMode={offlineMode}
          />

          <p className="text-xs text-gray-500">
            מוצגים {mapDevices.length} מכשירים ברדיוס ({result.devicesInRadius} סה״כ, כולל LoRa
            בלבד). מסלולי אופניים OSRM ל-5 המדורגים הראשונים (Breadcrumbs). במצב Offline — מפת
            Cache מדומה.
          </p>

          {dispatchReport && (
            <div className="rounded-lg border-2 border-blue-600 bg-blue-50 p-4">
              <h3 className="font-bold text-blue-900">דיווח למוקד (סימולציה)</h3>
              <p className="mt-1 text-sm">{dispatchReport.message}</p>
              <Link href="/dispatch" className="mt-2 inline-block text-sm text-blue-700 underline">
                צפייה במסך המוקד →
              </Link>
            </div>
          )}

          <section>
            <h2 className="mb-3 text-lg font-bold">מתנדבים מדורגים (מסלול אופניים)</h2>
            <ul className="space-y-2">
              {result.volunteers.map((v) => (
                <li
                  key={String(v.deviceId)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3"
                >
                  <div>
                    <span className="font-bold">{v.ownerName}</span>
                    {v.medicalTraining && v.medicalTraining !== 'none' && (
                      <span className="mr-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                        {medicalTrainingLabel(v.medicalTraining)}
                      </span>
                    )}
                    {v.isHealthy != null && (
                      <span className={healthBadgeClass(v.isHealthy)}>
                        {healthLabel(v.isHealthy)}
                      </span>
                    )}
                    <span className="mr-2 text-sm text-gray-600">
                      {v.distanceMeters} מ&apos; |
                      <span className={batteryLevelClass(v.batteryPercent)}>
                        {' '}
                        סוללת דפי {v.batteryPercent}%
                      </span>
                      {v.hasLora && (
                        <span className={batteryLevelClass(v.loraBatteryPercent ?? 100)}>
                          {' '}
                          | LoRa {v.loraBatteryPercent}%
                        </span>
                      )}
                      {' | '}
                      <span title={formatLastPingShort(v.lastPingAt)}>
                        שידור אחרון: {formatLastPing(v.lastPingAt)}
                      </span>
                    </span>
                    {v.route?.fallback && (
                      <span className="mr-2 text-xs text-amber-600">(קו ישר — OSRM לא זמין)</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      acceptVolunteer(
                        String(v.deviceId),
                        result.incidentId,
                        v.lat,
                        v.lon,
                        result.distress.lat,
                        result.distress.lon
                      )
                    }
                    className="rounded bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800"
                  >
                    אישור + Waze / Maps
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
      <div className="text-2xl font-bold text-red-700">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
