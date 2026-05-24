import { PrismaClient } from '@prisma/client/index';

const prisma = new PrismaClient();

async function main() {
  await prisma.idempotencyKey.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  await prisma.warehouse.createMany({
    data: [
      { name: 'New York Fulfillment', code: 'nyc-1', city: 'New York' },
      { name: 'Dallas Fulfillment', code: 'dal-1', city: 'Dallas' },
    ],
  });

  const nyc = await prisma.warehouse.findUniqueOrThrow({ where: { code: 'nyc-1' } });
  const dal = await prisma.warehouse.findUniqueOrThrow({ where: { code: 'dal-1' } });

  await prisma.product.createMany({
    data: [
      { name: 'Everyday Tee', sku: 'TEE-001', description: 'Soft cotton tee in multiple sizes.' },
      { name: 'Travel Mug', sku: 'MUG-002', description: 'Insulated 12oz mug for hot or cold drinks.' },
    ],
  });

  const tee = await prisma.product.findUniqueOrThrow({ where: { sku: 'TEE-001' } });
  const mug = await prisma.product.findUniqueOrThrow({ where: { sku: 'MUG-002' } });

  await prisma.inventory.createMany({
    data: [
      { productId: tee.id, warehouseId: nyc.id, totalUnits: 12, reservedUnits: 0 },
      { productId: tee.id, warehouseId: dal.id, totalUnits: 8, reservedUnits: 0 },
      { productId: mug.id, warehouseId: nyc.id, totalUnits: 5, reservedUnits: 0 },
      { productId: mug.id, warehouseId: dal.id, totalUnits: 10, reservedUnits: 0 },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });