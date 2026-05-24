# Take-Home-Exercise

Next.js App Router inventory reservation demo for multi-warehouse stock control.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a hosted Postgres instance from Supabase, Neon, or a similar provider.
2. Run `npm install`.
3. Run `npx prisma migrate dev`.
4. Run `npm run prisma:seed`.
5. Start the app with `npm run dev`.

The seed script populates demo products, warehouses, and stock so the app is immediately usable after migrations.

## Deployment

1. Create a hosted Postgres database on Supabase, Neon, or a similar provider.
2. Set `DATABASE_URL` in your Vercel project environment variables.
3. Set `CRON_SECRET` only if you plan to call the cleanup route manually; Vercel Cron requests are accepted automatically.
4. Run the Prisma migration and seed commands against the hosted database before or after the first deploy.

The repository includes `vercel.json` so Vercel can schedule the expiry cleanup route every five minutes.

## Behavior

- `GET /api/products` returns products with per-warehouse available stock.
- `GET /api/warehouses` lists warehouses.
- `POST /api/reservations` reserves units with a transactional stock check.
- `POST /api/reservations/:id/confirm` confirms a pending reservation.
- `POST /api/reservations/:id/release` releases a pending reservation.

The reserve path uses a database transaction and reads the inventory row before mutation, so only one request can consume the last unit successfully.

## Idempotency

- `POST /api/reservations` supports `Idempotency-Key` and replays the original response for repeated requests with the same key and payload.
- `POST /api/reservations/:id/confirm` also supports `Idempotency-Key` and replays the first confirmation response.
- Reusing the same key with a different payload returns a `409`.

## Expiry

Expired reservations are cleaned up in two ways:

- A cron-friendly route exists at `POST /api/cron/expire`.
- Reads also perform lazy cleanup before rendering products or reservations.

This keeps the demo correct even if the cron job is delayed.

In production, schedule `POST /api/cron/expire` with a Vercel Cron job or an equivalent managed scheduler.

## Trade-offs

- The UI currently reserves quantity 1 from a selected warehouse; extending it to multi-quantity is straightforward.
- Hosted Postgres is required for the real deployment. Local SQLite is intentionally avoided.