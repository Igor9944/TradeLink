-- Partial unique indexes for email and phone
-- Allows multiple NULL values but enforces uniqueness for non-NULL values

CREATE UNIQUE INDEX "users_email_not_null_idx" ON "users" ("email") WHERE "email" IS NOT NULL;
CREATE UNIQUE INDEX "users_phone_not_null_idx" ON "users" ("phone") WHERE "phone" IS NOT NULL;