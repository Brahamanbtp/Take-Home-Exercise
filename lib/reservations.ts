import { ReservationStatus } from '@prisma/client/index';
import type { Prisma } from '@prisma/client/index';
import { conflict, gone } from './api';
import { hasDatabaseUrl } from './db';
import { isExpired } from './dates';
import { getPrisma } from './prisma';

const HOLD_MINUTES = 10;

type Tx = Prisma.TransactionClient;

export async function cleanupExpiredReservations() {
  if (!hasDatabaseUrl()) {
    return;
  }

  const prisma = getPrisma();
  const expiredReservations = await prisma.reservation.findMany({
    where: { status: ReservationStatus.pending, expiresAt: { lte: new Date() } },
    select: { id: true, productId: true, warehouseId: true, quantity: true },
  });

  for (const reservation of expiredReservations) {
    await prisma.$transaction(async (tx: Tx) => {
      const freshRows = await tx.$queryRaw<Array<{
        id: string;
        status: ReservationStatus;
        productId: string;
        warehouseId: string;
        quantity: number;
        expiresAt: Date;
      }>>`
        SELECT *
        FROM "Reservation"
        WHERE "id" = ${reservation.id}
        FOR UPDATE
      `;
      const fresh = freshRows[0];

      if (!fresh || fresh.status !== ReservationStatus.pending || !isExpired(fresh.expiresAt)) {
        return;
      }

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: fresh.productId,
            warehouseId: fresh.warehouseId,
          },
        },
        data: { reservedUnits: { decrement: fresh.quantity } },
      });

      await tx.reservation.update({
        where: { id: fresh.id },
        data: { status: ReservationStatus.released, releasedAt: new Date() },
      });
    });
  }
}

export async function reserveStock(input: { productId: string; warehouseId: string; quantity: number }) {
  if (!hasDatabaseUrl()) {
    conflict('DATABASE_URL is not configured.');
  }

  const prisma = getPrisma();
  return prisma.$transaction(async (tx: Tx) => reserveStockInTx(tx, input));
}

export async function reserveStockInTx(tx: Tx, input: { productId: string; warehouseId: string; quantity: number }) {
    const inventoryRows = await tx.$queryRaw<Array<{
      id: string;
      productId: string;
      warehouseId: string;
      totalUnits: number;
      reservedUnits: number;
    }>>`
      SELECT *
      FROM "Inventory"
      WHERE "productId" = ${input.productId} AND "warehouseId" = ${input.warehouseId}
      FOR UPDATE
    `;
    const inventory = inventoryRows[0];

    if (!inventory) {
      conflict('No stock record found for this product and warehouse.');
    }

    const available = inventory.totalUnits - inventory.reservedUnits;
    if (available < input.quantity) {
      conflict('Not enough stock available for this reservation.');
    }

    const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

    const reservation = await tx.reservation.create({
      data: {
        productId: input.productId,
        warehouseId: input.warehouseId,
        quantity: input.quantity,
        expiresAt,
      },
    });

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { reservedUnits: { increment: input.quantity } },
    });

    return reservation;
}

export async function confirmReservation(id: string) {
  if (!hasDatabaseUrl()) {
    conflict('DATABASE_URL is not configured.');
  }

  const prisma = getPrisma();
  return prisma.$transaction(async (tx: Tx) => confirmReservationInTx(tx, id));
}

export async function confirmReservationInTx(tx: Tx, id: string) {
    const reservationRows = await tx.$queryRaw<Array<{
      id: string;
      productId: string;
      warehouseId: string;
      quantity: number;
      status: ReservationStatus;
      expiresAt: Date;
    }>>`
      SELECT *
      FROM "Reservation"
      WHERE "id" = ${id}
      FOR UPDATE
    `;
    const reservation = reservationRows[0];

    if (!reservation) {
      gone('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.pending) {
      return reservation;
    }

    if (isExpired(reservation.expiresAt)) {
      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      const released = await tx.reservation.update({
        where: { id },
        data: { status: ReservationStatus.released, releasedAt: new Date() },
      });

      gone('Reservation expired before confirmation.', released);
    }

    await tx.inventory.update({
      where: {
        productId_warehouseId: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
      },
      data: {
        totalUnits: { decrement: reservation.quantity },
        reservedUnits: { decrement: reservation.quantity },
      },
    });

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.confirmed, confirmedAt: new Date() },
    });
}

export async function releaseReservation(id: string) {
  if (!hasDatabaseUrl()) {
    conflict('DATABASE_URL is not configured.');
  }

  const prisma = getPrisma();
  return prisma.$transaction(async (tx: Tx) => releaseReservationInTx(tx, id));
}

export async function releaseReservationInTx(tx: Tx, id: string) {
    const reservationRows = await tx.$queryRaw<Array<{
      id: string;
      productId: string;
      warehouseId: string;
      quantity: number;
      status: ReservationStatus;
      expiresAt: Date;
    }>>`
      SELECT *
      FROM "Reservation"
      WHERE "id" = ${id}
      FOR UPDATE
    `;
    const reservation = reservationRows[0];

    if (!reservation) {
      gone('Reservation not found.');
    }

    if (reservation.status !== ReservationStatus.pending) {
      return reservation;
    }

    if (isExpired(reservation.expiresAt)) {
      gone('Reservation expired before it could be released.');
    }

    await tx.inventory.update({
      where: {
        productId_warehouseId: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
      },
      data: {
        reservedUnits: { decrement: reservation.quantity },
      },
    });

    return tx.reservation.update({
      where: { id },
      data: { status: ReservationStatus.released, releasedAt: new Date() },
    });
}