'use client';

import { useEffect, useRef, useState } from 'react';
import { formatLastPing, formatLastPingShort } from '@/lib/format';

export type MapDevice = {
  _id: string;
  ownerName: string;
  lat: number;
  lon: number;
  hasDefibrillator: boolean;
  hasLora: boolean;
  distanceMeters?: number;
  lastPingAt?: string;
  batteryPercent?: number;
  loraBatteryPercent?: number;
  isHealthy?: boolean;
  route?: {
    geometry: { coordinates: [number, number][] };
    fallback?: boolean;
  };
};

type Props = {
  center: { lat: number; lon: number };
  radiusMeters: number;
  devices: MapDevice[];
  distressLabel?: string;
  /** מצב Offline — מדמה מפות Cache (Meshtastic Bluetooth, ללא סלולר) */
  offlineMode?: boolean;
};

function devicesSignature(devices: MapDevice[]) {
  return devices
    .map(
      (d) =>
        `${d._id}:${d.lat}:${d.lon}:${d.hasDefibrillator}:${d.hasLora}:${d.distanceMeters ?? ''}:${d.lastPingAt ?? ''}:${d.batteryPercent ?? ''}:${d.loraBatteryPercent ?? ''}:${d.isHealthy ?? ''}:${d.route?.fallback ? 1 : 0}:${d.route?.geometry?.coordinates?.length ?? 0}`
    )
    .join('|');
}

function safeRemoveMap(map: import('leaflet').Map | null) {
  if (!map) return;
  try {
    map.stop();
    map.remove();
  } catch {
    /* Leaflet teardown race — container already gone */
  }
}

export default function DistressMap({
  center,
  radiusMeters,
  devices,
  distressLabel,
  offlineMode = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null);
  const overlayGroupRef = useRef<import('leaflet').LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const devicesSig = devicesSignature(devices);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapRef.current) return;

      const map = L.map(mapRef.current, { preferCanvas: true }).setView(
        [center.lat, center.lon],
        14
      );
      mapInstanceRef.current = map;
      overlayGroupRef.current = L.layerGroup().addTo(map);

      const url = offlineMode
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileLayerRef.current = L.tileLayer(url, {
        attribution: offlineMode ? '© Carto (Offline Cache Simulation)' : '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      if (!cancelled) setMapReady(true);
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      safeRemoveMap(mapInstanceRef.current);
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      overlayGroupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map init once per mount
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!mapReady || !map) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapInstanceRef.current) return;

      const url = offlineMode
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      tileLayerRef.current = L.tileLayer(url, {
        attribution: offlineMode ? '© Carto (Offline Cache Simulation)' : '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
    })();

    return () => {
      cancelled = true;
    };
  }, [mapReady, offlineMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = overlayGroupRef.current;
    if (!mapReady || !map || !group) return;

    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapInstanceRef.current || !overlayGroupRef.current) return;

      group.clearLayers();

      L.circle([center.lat, center.lon], {
        radius: radiusMeters,
        color: '#dc2626',
        fillColor: '#fecaca',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(group);

      const distressIcon = L.divIcon({
        className: '',
        html: '<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,.4)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([center.lat, center.lon], { icon: distressIcon })
        .addTo(group)
        .bindPopup(distressLabel || 'מיקום קריאת מצוקה');

      devices.forEach((d) => {
        const unhealthy = d.hasDefibrillator && d.isHealthy === false;
        const color = unhealthy ? '#dc2626' : d.hasDefibrillator ? '#16a34a' : '#2563eb';
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const healthText =
          d.hasDefibrillator && d.isHealthy != null
            ? d.isHealthy
              ? 'דפיברילטור תקין ✓'
              : 'דפיברילטור לא תקין ✗'
            : d.hasDefibrillator
              ? 'דפיברילטור ✓'
              : '';
        const batteryText =
          d.batteryPercent != null ? `<br/>סוללת דפי: ${d.batteryPercent}%` : '';
        const loraBatteryText =
          d.hasLora && d.loraBatteryPercent != null
            ? `<br/>סוללת LoRa: ${d.loraBatteryPercent}%`
            : '';
        L.marker([d.lat, d.lon], { icon })
          .addTo(group)
          .bindPopup(
            `<b>${d.ownerName}</b><br/>${healthText} ${d.hasLora ? 'LoRa ✓' : ''}${batteryText}${loraBatteryText}<br/>${d.distanceMeters != null ? d.distanceMeters + ' מ' : ''}<br/>שידור: ${formatLastPing(d.lastPingAt)}${formatLastPingShort(d.lastPingAt) ? ' (' + formatLastPingShort(d.lastPingAt) + ')' : ''}`
          );

        if (d.route?.geometry?.coordinates?.length) {
          const latlngs = d.route.geometry.coordinates.map(
            ([lon, lat]) => [lat, lon] as [number, number]
          );
          L.polyline(latlngs, {
            color: d.route.fallback ? '#94a3b8' : '#059669',
            weight: 4,
            dashArray: d.route.fallback ? '8 8' : undefined,
          }).addTo(group);
        }
      });

      const bounds: [number, number][] = [
        [center.lat, center.lon],
        ...devices.map((d) => [d.lat, d.lon] as [number, number]),
      ];

      requestAnimationFrame(() => {
        if (cancelled || !mapInstanceRef.current || !mapRef.current?.isConnected) return;
        try {
          if (bounds.length > 1) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: false });
          } else {
            mapInstanceRef.current.setView([center.lat, center.lon], 14, { animate: false });
          }
          mapInstanceRef.current.invalidateSize();
        } catch {
          /* ignore */
        }
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [mapReady, center.lat, center.lon, radiusMeters, devicesSig, distressLabel]);

  return (
    <div className="relative">
      {offlineMode && (
        <div className="absolute left-2 top-2 z-[1000] rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900 shadow">
          מצב Offline — מפת Cache (Meshtastic / Bluetooth)
        </div>
      )}
      <div ref={mapRef} className="z-0 h-[480px] w-full rounded-lg border" />
    </div>
  );
}
