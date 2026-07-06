/**
 * צפצוף מדומה — מדמה LoRa Downlink במכשיר (סימולטור WEB, לא חומרה).
 * משתמש ב-Web Audio API — אין קובץ שמע חיצוני.
 */
export function playLoRaDownlinkBeep(): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx = new AudioContext();
    const beep = (startSec: number, durationSec = 0.15, freq = 880) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + startSec);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + startSec + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startSec + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startSec);
      osc.stop(ctx.currentTime + startSec + durationSec + 0.05);
    };

    beep(0);
    beep(0.22);
    beep(0.44);

    setTimeout(() => ctx.close(), 800);
  } catch {
    // דפדפן חוסם שמע — לא קריטי
  }
}
