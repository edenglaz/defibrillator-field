/** סנכרון התראת מצוקה בין טאבים (emergency → volunteer) */

export const VOLUNTEER_ALERT_KEY = 'volunteerDistressAlert';
export const VOLUNTEER_ALERT_CHANNEL = 'volunteer-distress';
export const VOLUNTEER_ALERT_EVENT = 'volunteer-distress-alert';

export type VolunteerAlertPayload = {
  incidentId: string;
  lat: number;
  lon: number;
  radiusMeters: number;
  createdAt: string;
  ts: number;
};

let alertChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!alertChannel) alertChannel = new BroadcastChannel(VOLUNTEER_ALERT_CHANNEL);
  return alertChannel;
}

export function broadcastVolunteerAlert(data: {
  incidentId: string;
  lat: number;
  lon: number;
  radiusMeters: number;
}) {
  if (typeof window === 'undefined') return;
  const payload: VolunteerAlertPayload = {
    ...data,
    createdAt: new Date().toISOString(),
    ts: Date.now(),
  };
  localStorage.setItem(VOLUNTEER_ALERT_KEY, JSON.stringify(payload));
  getChannel()?.postMessage(payload);
  window.dispatchEvent(new CustomEvent(VOLUNTEER_ALERT_EVENT, { detail: payload }));
}

export function readVolunteerAlert(): VolunteerAlertPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VOLUNTEER_ALERT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VolunteerAlertPayload;
  } catch {
    return null;
  }
}

export function subscribeVolunteerAlert(
  handler: (payload: VolunteerAlertPayload) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const channel = getChannel();
  const onMessage = (e: MessageEvent<VolunteerAlertPayload>) => {
    if (e.data?.incidentId) handler(e.data);
  };
  channel?.addEventListener('message', onMessage);

  const onStorage = (e: StorageEvent) => {
    if (e.key === VOLUNTEER_ALERT_KEY && e.newValue) {
      try {
        handler(JSON.parse(e.newValue) as VolunteerAlertPayload);
      } catch {
        /* ignore */
      }
    }
  };
  window.addEventListener('storage', onStorage);

  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<VolunteerAlertPayload>).detail;
    if (detail?.incidentId) handler(detail);
  };
  window.addEventListener(VOLUNTEER_ALERT_EVENT, onCustom);

  return () => {
    channel?.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(VOLUNTEER_ALERT_EVENT, onCustom);
  };
}

export function payloadToIncident(p: VolunteerAlertPayload) {
  return {
    _id: p.incidentId,
    lat: p.lat,
    lon: p.lon,
    radiusMeters: p.radiusMeters,
    status: 'volunteers_notified',
    createdAt: p.createdAt,
  };
}
