'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

async function postAction(url: string) {
  const response = await fetch(url, { method: 'POST' });
  const data = await response.json();
  return { response, data };
}

export function ReservationActions({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ kind: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [busy, setBusy] = useState<null | 'confirm' | 'release'>(null);

  async function handleConfirm() {
    setBusy('confirm');
    setMessage(null);
    const { response, data } = await postAction(`/api/reservations/${reservationId}/confirm`);
    if (!response.ok) {
      setMessage({
        kind: response.status === 410 ? 'warning' : 'error',
        text: data.error ?? 'Unable to confirm reservation',
      });
      setBusy(null);
      return;
    }

    setMessage({ kind: 'success', text: 'Reservation confirmed.' });
    router.refresh();
    setBusy(null);
  }

  async function handleCancel() {
    setBusy('release');
    setMessage(null);
    const { response, data } = await postAction(`/api/reservations/${reservationId}/release`);
    if (!response.ok) {
      setMessage({
        kind: response.status === 410 ? 'warning' : 'error',
        text: data.error ?? 'Unable to release reservation',
      });
      setBusy(null);
      return;
    }

    setMessage({ kind: 'success', text: 'Reservation released.' });
    router.refresh();
    setBusy(null);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={busy !== null}
        className="rounded-full bg-moss px-4 py-2 text-sm font-medium text-white transition hover:bg-moss/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === 'confirm' ? 'Confirming...' : 'Confirm purchase'}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        disabled={busy !== null}
        className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy === 'release' ? 'Cancelling...' : 'Cancel'}
      </button>
      {message ? (
        <div
          role="status"
          className={`w-full rounded-2xl border px-4 py-3 text-sm ${
            message.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : message.kind === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
}