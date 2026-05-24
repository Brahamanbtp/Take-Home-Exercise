import { PrismaClient } from '@prisma/client/index';
import { hasDatabaseUrl } from './db';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

let prismaInstance: PrismaClient | undefined;

export function getPrisma() {
  if (!hasDatabaseUrl()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!prismaInstance) {
    prismaInstance = globalForPrisma.prisma ?? new PrismaClient();

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
  }

  return prismaInstance;
}