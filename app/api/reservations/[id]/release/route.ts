import { idParamSchema, jsonResponse, mapError } from '@/lib/api';
import { releaseReservation } from '@/lib/reservations';

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = idParamSchema.parse(await context.params);
    const reservation = await releaseReservation(id);
    return jsonResponse({ reservation });
  } catch (error) {
    return mapError(error);
  }
}