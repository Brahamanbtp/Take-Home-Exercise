import { reserveInputSchema, jsonResponse, mapError } from '@/lib/api';
import { reserveStock, reserveStockInTx } from '@/lib/reservations';
import { runIdempotentOperation } from '@/lib/idempotency';
import { createHash } from 'node:crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.clone().text();
    const body = reserveInputSchema.parse(JSON.parse(rawBody));
    const requestHash = createHash('sha256').update(JSON.stringify(body)).digest('hex');

    const idempotentResponse = await runIdempotentOperation({
      request,
      route: '/api/reservations',
      requestHash,
      handler: async (tx) => {
        const reservation = await reserveStockInTx(tx, body);
        return { status: 201, body: { reservation } };
      },
    });

    if (idempotentResponse) {
      return idempotentResponse;
    }

    const reservation = await reserveStock(body);
    return jsonResponse({ reservation }, 201);
  } catch (error) {
    return mapError(error);
  }
}