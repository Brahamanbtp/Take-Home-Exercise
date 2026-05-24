import { getWarehouses } from '@/lib/data';
import { jsonResponse, mapError } from '@/lib/api';

export async function GET() {
  try {
    const warehouses = await getWarehouses();
    return jsonResponse({ warehouses });
  } catch (error) {
    return mapError(error);
  }
}