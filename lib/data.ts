import { ReservationStatus } from '@prisma/client/index';
import { prisma } from './prisma';
import { cleanupExpiredReservations } from './reservations';

export async function getProducts() {
  await cleanupExpiredReservations();

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
  return prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });
}

export async function getReservation(id: string) {
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