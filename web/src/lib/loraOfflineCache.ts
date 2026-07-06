/** מטמון מיקום מצוקה שהתקבל דרך LoRa/Meshtastic (Offline) */

export type LoRaDistressCache = {
  incidentId: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  receivedAt: string;
  via: 'lora_mesh' | 'bluetooth_meshtastic';
};

const KEY = 'loraDistressCache';

export function saveLoRaDistressCache(data: Omit<LoRaDistressCache, 'receivedAt' | 'via'>) {
  if (typeof window === 'undefined') return;
  const entry: LoRaDistressCache = {
    ...data,
    receivedAt: new Date().toISOString(),
    via: 'lora_mesh',
  };
  localStorage.setItem(KEY, JSON.stringify(entry));
}

export function loadLoRaDistressCache(): LoRaDistressCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LoRaDistressCache) : null;
  } catch {
    return null;
  }
}

export function markBluetoothMeshtasticReceived() {
  const c = loadLoRaDistressCache();
  if (c) {
    c.via = 'bluetooth_meshtastic';
    localStorage.setItem(KEY, JSON.stringify(c));
  }
}
