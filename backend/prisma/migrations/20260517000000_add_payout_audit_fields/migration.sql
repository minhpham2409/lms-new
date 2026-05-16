-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "bankTransferRef" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processedByAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_processedByAdminId_fkey" FOREIGN KEY ("processedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
