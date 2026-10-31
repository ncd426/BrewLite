ALTER TABLE "Payment" ADD COLUMN "pointsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_pointsUsed_nonnegative" CHECK ("pointsUsed" >= 0);
