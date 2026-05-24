import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Inventory Reservations',
  description: 'Reservation-based inventory flow for multi-warehouse commerce.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}