/** תוויות ועיצוב לסטטוס מכשיר / סוללה */

export function healthLabel(isHealthy: boolean): string {
  return isHealthy ? 'תקין' : 'לא תקין';
}

export function healthBadgeClass(isHealthy: boolean): string {
  return isHealthy
    ? 'rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800'
    : 'rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800';
}

export function batteryLevelClass(pct: number): string {
  if (pct < 20) return 'font-bold text-red-600';
  if (pct < 50) return 'text-amber-600';
  return 'text-green-700';
}
