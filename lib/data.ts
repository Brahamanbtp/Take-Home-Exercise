import { ReservationStatus } from '@prisma/client/index';
import { hasDatabaseUrl } from './db';
import { getPrisma } from './prisma';
import { cleanupExpiredReservations } from './reservations';

function isUnavailableDatabaseError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes('DATABASE_URL is not configured.') ||
    error.message.includes('PrismaClientInitializationError') ||
    error.message.includes('Can\'t reach database server') ||
    error.message.includes('P1001')
  );
}

export async function getProducts() {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    await cleanupExpiredReservations();

    const prisma = getPrisma();
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        inventories: {
          include: { warehouse: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return products.map((product) => ({
      ...product,
      inventories: product.inventories.map((inventory) => ({
        ...inventory,
        availableUnits: inventory.totalUnits - inventory.reservedUnits,
      })),
    }));
  } catch (error) {
    if (isUnavailableDatabaseError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getWarehouses() {
  if (!hasDatabaseUrl()) {
    return [];
  }

  try {
    const prisma = getPrisma();
    return prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });
  } catch (error) {
    if (isUnavailableDatabaseError(error)) {
      return [];
    }

    throw error;
  }
}

export async function getReservation(id: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }

  try {
    const prisma = getPrisma();
    await cleanupExpiredReservations();

    return prisma.reservation.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });
  } catch (error) {
    if (isUnavailableDatabaseError(error)) {
      return null;
    }

    throw error;
  }
}

export async function getReservationState(id: string) {
  const reservation = await getReservation(id);

  if (!reservation) {
    return null;
  }

  return {
    ...reservation,
    isExpired: reservation.status === ReservationStatus.pending && reservation.expiresAt.getTime() <= Date.now(),
  };
}