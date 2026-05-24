import { getProducts } from '@/lib/data';
import { jsonResponse, mapError } from '@/lib/api';

export async function GET() {
  try {
    const products = await getProducts();
    return jsonResponse({ products });
  } catch (error) {
    return mapError(error);
  }
}