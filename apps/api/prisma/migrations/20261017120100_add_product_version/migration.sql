-- Optimistic-lock counter. Existing products get version = 0;
-- subsequent writes must increment version in application code.
ALTER TABLE "Product" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
