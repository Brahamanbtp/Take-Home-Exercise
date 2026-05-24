import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Countdown } from '@/components/countdown';
import { ReservationActions } from '@/components/reservation-actions';
import { getReservationState } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ReservationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = await getReservationState(id);

  if (!reservation) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-moss">Reservation</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{reservation.product.name}</h1>
        <p className="mt-2 text-slate-600">Warehouse: {reservation.warehouse.name}</p>

        <div
          className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
            reservation.status === 'pending'
              ? reservation.isExpired
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-sky-200 bg-sky-50 text-sky-900'
              : reservation.status === 'confirmed'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          {reservation.status === 'pending' && reservation.isExpired
            ? 'This reservation has expired and will be released on the next cleanup run.'
            : reservation.status === 'pending'
              ? 'This reservation is active. Confirm before the countdown reaches zero.'
              : reservation.status === 'confirmed'
                ? 'This reservation has been confirmed and stock has been deducted.'
                : 'This reservation was released and the inventory is available again.'}
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-sand/70 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Reservation status</dt>
            <dd className="mt-2 text-lg font-medium text-ink">{reservation.status}</dd>
          </div>
          <div className="rounded-2xl bg-sand/70 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Expires in</dt>
            <dd className="mt-2 text-lg font-medium text-ink">
              {reservation.status === 'pending' ? <Countdown expiresAt={reservation.expiresAt.toISOString()} /> : 'No active hold'}
            </dd>
          </div>
          <div className="rounded-2xl bg-sand/70 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Quantity</dt>
            <dd className="mt-2 text-lg font-medium text-ink">{reservation.quantity}</dd>
          </div>
          <div className="rounded-2xl bg-sand/70 p-4">
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Reservation ID</dt>
            <dd className="mt-2 break-all text-sm font-medium text-ink">{reservation.id}</dd>
          </div>
        </dl>

        <div className="mt-8">
          {reservation.status === 'pending' ? (
            <ReservationActions reservationId={reservation.id} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                This reservation is already {reservation.status}. Changes are reflected without a manual refresh.
              </p>
              <Link href="/" className="inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
                Back to products
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}