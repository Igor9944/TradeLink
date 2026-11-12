DROP INDEX IF EXISTS "invoices_orderId_idx";

CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");
