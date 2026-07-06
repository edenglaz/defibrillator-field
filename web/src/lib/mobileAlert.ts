/**
 * התראת Push סלולרית — Web: שמע רועש + רטט + Notification (מקביל לעקיפת "נא לא להפריע").
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showDistressNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      requireInteraction: true,
      tag: 'distress-alert',
    });
  } catch {
    /* ignore */
  }
}

export function vibrateEmergency() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([400, 150, 400, 150, 400, 150, 600]);
  }
}

export function playEmergencyPushAlert(): void {
  if (typeof window === 'undefined') return;

  vibrateEmergency();

  try {
    const ctx = new AudioContext();
    const pulse = (start: number, freq: number, dur = 0.35) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.45, ctx.currentTime + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };

    pulse(0, 880);
    pulse(0.4, 1100);
    pulse(0.8, 880);
    pulse(1.2, 1100);
    pulse(1.6, 880);

    setTimeout(() => ctx.close(), 2200);
  } catch {
    /* ignore */
  }
}
