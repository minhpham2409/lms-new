# Production Runbook

## Required deploy checks

Run these before promoting a build:

```bash
cd backend
npm run build
npm test -- --runInBand
npx prisma validate --schema=prisma/schema.prisma
npx prisma migrate deploy
npx prisma generate

cd ../frontend
npm run build
```

Required runtime services:

- PostgreSQL
- Redis for Bull queues
- S3-compatible object storage
- `ffmpeg` on the backend runtime image

Required production environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `WEBHOOK_SECRET`
- `SEPAY_API_KEY`
- `FRONTEND_URL`
- `API_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`

## Queue monitoring

Admin endpoints:

- `GET /api/v1/admin/queues/health`
- `GET /api/v1/admin/queues/:name/failed?limit=20`

Queue names:

- `email-queue`
- `certificate-queue`
- `notification-queue`
- `video-queue`
- `wallet-queue`

Investigate any non-zero `failed` count before production release. Failed wallet jobs can delay teacher earnings. Failed video jobs can leave a lesson without playable media.

## Database backup

Daily backup:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="backup-$(date +%Y%m%d-%H%M%S).dump"
```

Restore into an empty database:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" backup-YYYYMMDD-HHMMSS.dump
npx prisma migrate deploy
```

Recommended policy:

- Keep daily backups for at least 14 days.
- Keep weekly backups for at least 8 weeks.
- Test restore monthly on a staging database.
- Store backups outside the app server.

## Media cleanup

Orphan `MediaAsset` rows are cleaned by `MediaCleanupService` every day at 03:00 server time.

Config:

- `MEDIA_ORPHAN_TTL_HOURS`, default `24`
- `MEDIA_ORPHAN_CLEANUP_BATCH_SIZE`, default `100`

An orphan media asset is a `PROCESSING`, `READY`, `FAILED`, or `ORPHANED` asset older than the TTL and not attached to a lesson.

## Production smoke test

Run this on staging after every deploy and on production after first release:

1. Create a teacher, student, and admin.
2. Teacher creates a course, uploads a video, waits for HLS processing to complete, creates a lesson with the returned `mediaAssetId`, and submits course for review.
3. Admin publishes the course.
4. Student creates an order and generates QR payment.
5. Send a SePay webhook with the correct `SEPAY_API_KEY` and matching `txnRef`/amount.
6. Verify:
   - payment becomes completed
   - order becomes paid
   - enrollment becomes active
   - student can access `/lessons/:id`
   - student can play `/media/hls/...`
   - `wallet-queue` has no failed jobs
   - teacher wallet balance increases after the revenue split job
7. Teacher creates a payout request.
8. Admin approves the payout with a bank transfer reference.
9. Verify:
   - payout status is approved
   - teacher `pendingBalance` decreases
   - wallet transaction history includes the withdrawal approval
