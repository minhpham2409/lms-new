/*
  Phase 2 refactor: Drop Certificate, simplify RefundRequest

  - Drop Certificate table (3 rows will be lost — feature is being removed)
  - Remove RefundRequest columns: paymentId, childId, refundQrUrl, refundQrData
  - Add RefundRequest column: adminNote
  - Drop childId index from RefundRequest
*/

-- DropTable
DROP TABLE IF EXISTS "Certificate";

-- AlterTable: Remove unused columns from RefundRequest
ALTER TABLE "RefundRequest" DROP COLUMN IF EXISTS "paymentId";
ALTER TABLE "RefundRequest" DROP COLUMN IF EXISTS "childId";
ALTER TABLE "RefundRequest" DROP COLUMN IF EXISTS "refundQrUrl";
ALTER TABLE "RefundRequest" DROP COLUMN IF EXISTS "refundQrData";

-- Add adminNote column
ALTER TABLE "RefundRequest" ADD COLUMN IF NOT EXISTS "adminNote" TEXT;
