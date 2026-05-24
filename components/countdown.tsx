'use client';

import { useEffect, useState } from 'react';
import { formatCountdown } from '@/lib/dates';

export function Countdown({ expiresAt }: { expiresAt: string }) {
  const [value, setValue] = useState(() => formatCountdown(expiresAt));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setValue(formatCountdown(expiresAt));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return <span>{value}</span>;
}