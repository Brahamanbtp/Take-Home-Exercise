import { Prisma } from '@prisma/client/index';
import { z } from 'zod';

export const reserveInputSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function badRequest(message: string, details?: unknown): never {
  throw new ApiError(400, message, details);
}

export function conflict(message: string, details?: unknown): never {
  throw new ApiError(409, message, details);
}

export function gone(message: string, details?: unknown): never {
  throw new ApiError(410, message, details);
}

export function mapError(error: unknown) {
  if (error instanceof ApiError) {
    return jsonResponse({ error: error.message, details: error.details }, error.status);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return jsonResponse({ error: 'Database request failed' }, 500);
  }

  console.error(error);
  return jsonResponse({ error: 'Unexpected error' }, 500);
}