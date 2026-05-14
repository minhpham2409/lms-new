-- =============================================================
-- Migration: wallet_enums_idempotency
-- Convert WalletTransaction.type and PayoutRequest.status from
-- String to Prisma enums. Add idempotencyKey for idempotent
-- revenue split. Widen Decimal precision to (12,2).
-- =============================================================

-- 1. Create enum types
CREATE TYPE "WalletTransactionType" AS ENUM ('EARNING', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'ADJUSTMENT');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- 2. Widen Decimal precision from (10,2) to (12,2)
ALTER TABLE "Wallet" ALTER COLUMN "balance" TYPE DECIMAL(12,2);
ALTER TABLE "Wallet" ALTER COLUMN "pendingBalance" TYPE DECIMAL(12,2);
ALTER TABLE "Wallet" ALTER COLUMN "totalEarned" TYPE DECIMAL(12,2);
ALTER TABLE "WalletTransaction" ALTER COLUMN "amount" TYPE DECIMAL(12,2);
ALTER TABLE "PayoutRequest" ALTER COLUMN "amount" TYPE DECIMAL(12,2);

-- 3. Add idempotencyKey column
ALTER TABLE "WalletTransaction" ADD COLUMN "idempotencyKey" TEXT;

-- 4. Drop text defaults before enum casts. PostgreSQL cannot cast an
--    existing text default to an enum default automatically.
ALTER TABLE "PayoutRequest" ALTER COLUMN "status" DROP DEFAULT;

-- 5. Convert WalletTransaction.type from String to enum
--    Map existing string values:
--    "EARNING"     -> EARNING
--    "WITHDRAWAL"  -> WITHDRAWAL_REQUEST (best-effort mapping; see note below)
--    Any other     -> ADJUSTMENT (safe fallback)
--
--    NOTE: Existing "WITHDRAWAL" records may represent either a request
--    or an approved withdrawal. Without additional context in the old
--    schema, we map them all to WITHDRAWAL_REQUEST. If historical data
--    needs correction, it should be done via a data migration script.
ALTER TABLE "WalletTransaction"
  ALTER COLUMN "type" TYPE "WalletTransactionType"
  USING (
    CASE "type"
      WHEN 'EARNING' THEN 'EARNING'::"WalletTransactionType"
      WHEN 'WITHDRAWAL' THEN 'WITHDRAWAL_REQUEST'::"WalletTransactionType"
      WHEN 'WITHDRAWAL_REQUEST' THEN 'WITHDRAWAL_REQUEST'::"WalletTransactionType"
      WHEN 'WITHDRAWAL_APPROVED' THEN 'WITHDRAWAL_APPROVED'::"WalletTransactionType"
      WHEN 'WITHDRAWAL_REJECTED' THEN 'WITHDRAWAL_REJECTED'::"WalletTransactionType"
      WHEN 'ADJUSTMENT' THEN 'ADJUSTMENT'::"WalletTransactionType"
      ELSE 'ADJUSTMENT'::"WalletTransactionType"
    END
  );

-- 6. Convert PayoutRequest.status from String to enum
ALTER TABLE "PayoutRequest"
  ALTER COLUMN "status" TYPE "PayoutStatus"
  USING (
    CASE "status"
      WHEN 'PENDING' THEN 'PENDING'::"PayoutStatus"
      WHEN 'APPROVED' THEN 'APPROVED'::"PayoutStatus"
      WHEN 'REJECTED' THEN 'REJECTED'::"PayoutStatus"
      WHEN 'CANCELLED' THEN 'CANCELLED'::"PayoutStatus"
      ELSE 'PENDING'::"PayoutStatus"
    END
  );

-- 7. Set default for PayoutRequest.status
ALTER TABLE "PayoutRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"PayoutStatus";

-- 8. Add unique constraint on idempotencyKey (NULL values are allowed)
CREATE UNIQUE INDEX "WalletTransaction_idempotencyKey_key" ON "WalletTransaction"("idempotencyKey");

-- 9. Add performance indexes
CREATE INDEX "WalletTransaction_referenceId_idx" ON "WalletTransaction"("referenceId");
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");
