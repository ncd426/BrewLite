-- BrewLite additive migration AFTER the 2 existing core migrations.
-- Designed to preserve all existing rows in the five core tables.
-- REQUIRED PRECONDITION: Product.version migration is already applied.

CREATE TYPE "DiscountType" AS ENUM ('FIXED', 'PERCENT');

CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minOrderTotal" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

ALTER TABLE "Order"
    ADD COLUMN "discountAmount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "promotionId" INTEGER,
    ADD COLUMN "loyaltyAwardedAt" TIMESTAMP(3);

ALTER TABLE "OrderItem"
    ADD COLUMN "unitPrice" INTEGER,
    ADD COLUMN "toppings" JSONB;

ALTER TABLE "Order"
    ADD CONSTRAINT "Order_promotionId_fkey"
    FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
