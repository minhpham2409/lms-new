-- AlterTable
ALTER TABLE "RefundRequest" ADD COLUMN "refundQrUrl" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "refundQrData" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "processedByAdminId" TEXT;
ALTER TABLE "RefundRequest" ADD COLUMN "processedAt" TIMESTAMP(3);
ALTER TABLE "RefundRequest" ADD COLUMN "bankTransferRef" TEXT;
