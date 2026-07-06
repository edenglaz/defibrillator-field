/** פורמט זמן שידור אחרון (lastPingAt) לתצוגה בעברית */
export function formatLastPing(lastPingAt?: string | Date | null): string {
  if (!lastPingAt) return 'לא ידוע';
  const then = new Date(lastPingAt).getTime();
  if (Number.isNaN(then)) return 'לא ידוע';

  const diffMs = Date.now() - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'לפני פחות מדקה';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  return new Date(lastPingAt).toLocaleString('he-IL');
}

export function formatLastPingShort(lastPingAt?: string | Date | null): string {
  if (!lastPingAt) return '';
  const then = new Date(lastPingAt);
  if (Number.isNaN(then.getTime())) return '';
  return then.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
