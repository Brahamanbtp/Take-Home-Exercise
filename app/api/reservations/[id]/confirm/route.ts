import { idParamSchema, jsonResponse, mapError } from '@/lib/api';
import { confirmReservation, confirmReservationInTx } from '@/lib/reservations';
import { runIdempotentOperation } from '@/lib/idempotency';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = idParamSchema.parse(await context.params);

    const idempotentResponse = await runIdempotentOperation({
      request,
      route: `/api/reservations/${id}/confirm`,
      requestHash: id,
      handler: async (tx) => {
        const reservation = await confirmReservationInTx(tx, id);
        return { status: 200, body: { reservation } };
      },
    });

    if (idempotentResponse) {
      return idempotentResponse;
    }

    const reservation = await confirmReservation(id);
    return jsonResponse({ reservation });
  } catch (error) {
    return mapError(error);
  }
}