import { getProducts } from '@/lib/data';
import { ReserveButton } from '@/components/reserve-button';
import { hasDatabaseUrl } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <section className="mb-10 rounded-3xl border border-black/10 bg-white/80 p-8 shadow-soft backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-moss">Allo Engineering</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Inventory reservation flow with warehouse-level stock control.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Reserve stock at checkout, confirm when payment succeeds, and release it if the user cancels or the hold expires.
        </p>
      </section>

      {!hasDatabaseUrl() ? (
        <section className="mb-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">Database not configured</p>
          <p className="mt-2 text-sm leading-6">
            Set `DATABASE_URL` to a hosted Postgres connection string, then run the Prisma migration and seed commands.
            The app shows this fallback instead of crashing when the database is unavailable.
          </p>
        </section>
      ) : null}

      <section className="grid gap-6">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
            {(() => {
              const totalUnits = product.inventories.reduce((sum, inventory) => sum + inventory.totalUnits, 0);
              const reservedUnits = product.inventories.reduce((sum, inventory) => sum + inventory.reservedUnits, 0);
              const availableUnits = totalUnits - reservedUnits;

              return (
                <>
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{product.sku}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-ink">{product.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{product.description}</p>
                    </div>

                    <div className="grid min-w-[14rem] grid-cols-3 gap-3 rounded-2xl bg-sand/70 p-4 text-center text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total</p>
                        <p className="mt-1 text-xl font-semibold text-ink">{totalUnits}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reserved</p>
                        <p className="mt-1 text-xl font-semibold text-moss">{reservedUnits}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Available</p>
                        <p className="mt-1 text-xl font-semibold text-ink">{availableUnits}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {product.inventories.map((inventory) => (
                      <div key={inventory.id} className="rounded-2xl bg-sand/70 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-ink">{inventory.warehouse.name}</p>
                            <p className="text-sm text-slate-600">{inventory.warehouse.city}</p>
                          </div>
                          <div className="text-right text-sm text-slate-700">
                            <p>Total {inventory.totalUnits}</p>
                            <p>Reserved {inventory.reservedUnits}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Available</p>
                            <p className="text-3xl font-semibold text-moss">{inventory.availableUnits}</p>
                          </div>
                          <ReserveButton
                            productId={product.id}
                            warehouseId={inventory.warehouseId}
                            maxQuantity={inventory.availableUnits}
                            disabled={inventory.availableUnits <= 0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </article>
        ))}
      </section>

      <div className="mt-10 text-sm text-slate-500">
        Reservations are managed through the API. Visit a reservation once created to confirm or release it.
      </div>
    </main>
  );
}