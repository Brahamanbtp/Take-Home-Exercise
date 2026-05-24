import type { Prisma } from '@prisma/client/index';
import { createHash } from 'node:crypto';
import { conflict, jsonResponse } from './api';
import { getPrisma } from './prisma';

type IdempotentResult<T> = {
  status: number;
  body: T;
};

function lockKey(route: string, key: string) {
  const digest = createHash('sha256').update(`${route}:${key}`).digest();
  return [digest.readInt32BE(0), digest.readInt32BE(4)] as const;
}

function normalizeJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function runIdempotentOperation<T>(options: {
  request: Request;
  route: string;
  requestHash: string;
  handler: (tx: Prisma.TransactionClient) => Promise<IdempotentResult<T>>;
}) {
  const key = options.request.headers.get('Idempotency-Key');

  if (!key) {
    return null;
  }

  const [lockA, lockB] = lockKey(options.route, key);

  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(${lockA}, ${lockB})
    `;

    const existing = await tx.idempotencyKey.findUnique({
      where: {
        key_route: {
          key,
          route: options.route,
        },
      },
    });

    if (existing) {
      if (existing.requestHash !== options.requestHash) {
        conflict('Idempotency-Key was reused with a different request payload.');
      }

      return jsonResponse(existing.responseBody, existing.responseStatus);
    }

    const result = await options.handler(tx);
    const responseBody = normalizeJson(result.body);

    await tx.idempotencyKey.create({
      data: {
        key,
        route: options.route,
        requestHash: options.requestHash,
        responseStatus: result.status,
        responseBody,
      },
    });

    return jsonResponse(result.body, result.status);
  });
}