import { ReservationStatus } from '@prisma/client/index';
import { hasDatabaseUrl } from './db';
import { getPrisma } from './prisma';
import { cleanupExpiredReservations } from './reservations';

export async function getProducts() {
  if (!hasDatabaseUrl()) {
    return [];
  }

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
}

export async function getWarehouses() {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const prisma = getPrisma();
  return prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function getReservation(id: string) {
  if (!hasDatabaseUrl()) {
    return null;
  }

  const prisma = getPrisma();
  await cleanupExpiredReservations();

  return prisma.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });
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