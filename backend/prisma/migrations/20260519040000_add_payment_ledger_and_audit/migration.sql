-- Ledger for every bank transfer/webhook event processed against a payment.
CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "paymentId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "txnRef" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'sepay',
  "providerRef" TEXT,
  "webhookEventId" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "expectedAmount" DECIMAL(10,2),
  "paidBefore" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "remainingAfter" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "overpaidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "rawPayload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_webhookEventId_key" ON "PaymentTransaction"("webhookEventId");
CREATE INDEX "PaymentTransaction_paymentId_createdAt_idx" ON "PaymentTransaction"("paymentId", "createdAt");
CREATE INDEX "PaymentTransaction_orderId_createdAt_idx" ON "PaymentTransaction"("orderId", "createdAt");
CREATE INDEX "PaymentTransaction_txnRef_idx" ON "PaymentTransaction"("txnRef");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_paymentId_fkey"
  FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PaymentTransaction"
  ADD CONSTRAINT "PaymentTransaction_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Generic audit log for sensitive manual actions.
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorRole" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
