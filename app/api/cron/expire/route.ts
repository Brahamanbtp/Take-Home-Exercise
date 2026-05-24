import { cleanupExpiredReservations } from '@/lib/reservations';
import { jsonResponse } from '@/lib/api';

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET && !isVercelCron) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  await cleanupExpiredReservations();
  return jsonResponse({ ok: true });
}