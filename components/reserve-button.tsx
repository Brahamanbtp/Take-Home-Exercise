'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ReserveButton({
  productId,
  warehouseId,
  maxQuantity,
  disabled,
}: {
  productId: string;
  warehouseId: string;
  maxQuantity: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState<{ kind: 'error' | 'warning'; title: string; message: string } | null>(null);

  async function handleReserve() {
    setLoading(true);
    setNotice(null);

    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, warehouseId, quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      const kind = response.status === 410 ? 'warning' : 'error';
      const title = response.status === 409 ? 'Not enough stock' : response.status === 410 ? 'Reservation expired' : 'Reservation failed';
      setNotice({
        kind,
        title,
        message: data.error ?? 'Please try again.',
      });
      setLoading(false);
      return;
    }

    router.push(`/reservations/${data.reservation.id}`);
    router.refresh();
  }

  const stepDisabled = disabled || loading || maxQuantity <= 1;

  return (
    <div className="space-y-3 text-right">
      <div className="flex items-center justify-end gap-3">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500" htmlFor={`${productId}-${warehouseId}-qty`}>
          Qty
        </label>
        <input
          id={`${productId}-${warehouseId}-qty`}
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            if (Number.isNaN(nextValue)) {
              setQuantity(1);
              return;
            }
            setQuantity(Math.max(1, Math.min(maxQuantity, nextValue)));
          }}
          disabled={disabled || loading}
          className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-right text-sm text-ink outline-none transition focus:border-moss disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReserve}
          disabled={disabled || loading}
          className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Reserving...' : 'Reserve'}
        </button>
      </div>

      {notice ? (
        <div
          role="status"
          className={`max-w-[16rem] rounded-2xl border px-3 py-2 text-left text-xs shadow-sm ${
            notice.kind === 'warning'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <p className="font-semibold">{notice.title}</p>
          <p className="mt-1 leading-5">{notice.message}</p>
        </div>
      ) : null}
    </div>
  );
}