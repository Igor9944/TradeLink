CREATE INDEX "kyc_records_reviewedById_idx" ON "kyc_records"("reviewedById");
CREATE INDEX "generated_documents_generatedById_idx" ON "generated_documents"("generatedById");
CREATE INDEX "dynamic_field_schemas_approvedById_idx" ON "dynamic_field_schemas"("approvedById");
CREATE INDEX "ticket_messages_senderId_idx" ON "ticket_messages"("senderId");
CREATE INDEX "system_configs_updatedById_idx" ON "system_configs"("updatedById");

ALTER TABLE "kyc_records"
  ADD CONSTRAINT "kyc_records_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "generated_documents"
  ADD CONSTRAINT "generated_documents_generatedById_fkey"
  FOREIGN KEY ("generatedById") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dynamic_field_schemas"
  ADD CONSTRAINT "dynamic_field_schemas_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ticket_messages"
  ADD CONSTRAINT "ticket_messages_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "system_configs"
  ADD CONSTRAINT "system_configs_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
