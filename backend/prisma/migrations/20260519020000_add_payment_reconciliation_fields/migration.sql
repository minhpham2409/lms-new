-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "remainingAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD COLUMN "overpaidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Backfill existing rows for reconciliation displays.
UPDATE "Payment"
SET "remainingAmount" = "amount"
WHERE "status" = 'pending' AND "remainingAmount" = 0;

UPDATE "Payment"
SET "paidAmount" = "amount", "remainingAmount" = 0
WHERE "status" = 'completed' AND "paidAmount" = 0;
