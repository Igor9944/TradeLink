DROP INDEX IF EXISTS "users_email_idx";
DROP INDEX IF EXISTS "users_phone_idx";
DROP INDEX IF EXISTS "user_sessions_refreshToken_idx";
DROP INDEX IF EXISTS "products_sku_idx";

DROP INDEX IF EXISTS "payments_invoiceId_idx";
CREATE INDEX "payments_invoiceId_createdAt_idx" ON "payments"("invoiceId", "createdAt");

DROP INDEX IF EXISTS "shipment_events_shipmentId_idx";
CREATE INDEX "shipment_events_shipmentId_timestamp_idx"
  ON "shipment_events"("shipmentId", "timestamp");

DROP INDEX IF EXISTS "ticket_messages_ticketId_idx";
CREATE INDEX "ticket_messages_ticketId_sentAt_idx"
  ON "ticket_messages"("ticketId", "sentAt");

ALTER TABLE "products"
  ADD CONSTRAINT "products_priceHT_nonnegative_check" CHECK ("priceHT" >= 0),
  ADD CONSTRAINT "products_taxRate_range_check" CHECK ("taxRate" >= 0 AND "taxRate" <= 1),
  ADD CONSTRAINT "products_stockQuantity_nonnegative_check" CHECK ("stockQuantity" >= 0),
  ADD CONSTRAINT "products_stockAlertLevel_nonnegative_check" CHECK ("stockAlertLevel" >= 0);

ALTER TABLE "product_variants"
  ADD CONSTRAINT "product_variants_priceHT_nonnegative_check" CHECK ("priceHT" IS NULL OR "priceHT" >= 0),
  ADD CONSTRAINT "product_variants_stockQuantity_nonnegative_check" CHECK ("stockQuantity" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive_check" CHECK (quantity > 0),
  ADD CONSTRAINT "order_items_amounts_nonnegative_check"
    CHECK ("unitPriceHT" >= 0 AND "totalHT" >= 0 AND "totalTTC" >= 0),
  ADD CONSTRAINT "order_items_taxRate_range_check" CHECK ("taxRate" >= 0 AND "taxRate" <= 1),
  ADD CONSTRAINT "order_items_totals_consistent_check"
    CHECK ("totalHT" = "unitPriceHT" * quantity AND "totalTTC" = round("totalHT" * (1 + "taxRate"), 3));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_nonnegative_check"
    CHECK ("totalHT" >= 0 AND "totalTax" >= 0 AND "totalTTC" >= 0),
  ADD CONSTRAINT "orders_totals_consistent_check"
    CHECK ("totalTTC" = "totalHT" + "totalTax");

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_amounts_nonnegative_check"
    CHECK ("totalHT" >= 0 AND "totalTax" >= 0 AND "totalTTC" >= 0),
  ADD CONSTRAINT "invoices_totals_consistent_check"
    CHECK ("totalTTC" = "totalHT" + "totalTax");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_positive_check" CHECK (amount > 0),
  ADD CONSTRAINT "payments_parent_required_check" CHECK ("invoiceId" IS NOT NULL OR "orderId" IS NOT NULL);

ALTER TABLE "kyc_documents"
  ADD CONSTRAINT "kyc_documents_file_size_positive_check" CHECK ("fileSizeBytes" > 0);

ALTER TABLE "rooms"
  ADD CONSTRAINT "rooms_maxParticipants_positive_check" CHECK ("maxParticipants" > 0);
