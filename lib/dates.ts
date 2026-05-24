export function isExpired(expiresAt: Date, now = new Date()) {
  return expiresAt.getTime() <= now.getTime();
}

export function formatCountdown(target: string | Date) {
  const end = typeof target === 'string' ? new Date(target) : target;
  const diff = Math.max(0, end.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}