ALTER TABLE "Product"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "description" TEXT,
  DROP COLUMN "stock",
  DROP COLUMN "version";

CREATE TABLE "Ingredient" (
  "id" SERIAL NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "stockQuantity" INTEGER NOT NULL DEFAULT 0,
  "minStock" INTEGER NOT NULL DEFAULT 0,
  "importPrice" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Ingredient_unit_check" CHECK ("unit" IN ('g', 'ml')),
  CONSTRAINT "Ingredient_stockQuantity_check" CHECK ("stockQuantity" >= 0),
  CONSTRAINT "Ingredient_minStock_check" CHECK ("minStock" >= 0),
  CONSTRAINT "Ingredient_importPrice_check" CHECK ("importPrice" IS NULL OR "importPrice" >= 0)
);

CREATE TABLE "ProductIngredient" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "ingredientId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "isOptional" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductIngredient_quantity_check" CHECK ("quantity" > 0)
);

CREATE UNIQUE INDEX "Ingredient_code_key" ON "Ingredient"("code");
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");
CREATE UNIQUE INDEX "ProductIngredient_productId_ingredientId_key"
  ON "ProductIngredient"("productId", "ingredientId");
CREATE INDEX "ProductIngredient_ingredientId_idx"
  ON "ProductIngredient"("ingredientId");

ALTER TABLE "ProductIngredient"
  ADD CONSTRAINT "ProductIngredient_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductIngredient"
  ADD CONSTRAINT "ProductIngredient_ingredientId_fkey"
  FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Ingredient" ("code", "name", "unit", "updatedAt") VALUES
  ('I001', 'Cà phê bột rang xay', 'g', CURRENT_TIMESTAMP),
  ('I002', 'Espresso', 'ml', CURRENT_TIMESTAMP),
  ('I003', 'Cold Brew Concentrate', 'ml', CURRENT_TIMESTAMP),
  ('I004', 'Sữa tươi không đường', 'ml', CURRENT_TIMESTAMP),
  ('I005', 'Sữa đặc', 'ml', CURRENT_TIMESTAMP),
  ('I006', 'Đường', 'g', CURRENT_TIMESTAMP),
  ('I007', 'Nước đường', 'ml', CURRENT_TIMESTAMP),
  ('I008', 'Nước nóng', 'ml', CURRENT_TIMESTAMP),
  ('I009', 'Nước lọc', 'ml', CURRENT_TIMESTAMP),
  ('I010', 'Đá viên', 'g', CURRENT_TIMESTAMP),
  ('I011', 'Bột cacao', 'g', CURRENT_TIMESTAMP),
  ('I012', 'Trà đen đã ủ', 'ml', CURRENT_TIMESTAMP),
  ('I013', 'Syrup đào', 'ml', CURRENT_TIMESTAMP),
  ('I014', 'Nước cam tươi', 'ml', CURRENT_TIMESTAMP),
  ('I015', 'Sả tươi', 'g', CURRENT_TIMESTAMP),
  ('I016', 'Đào ngâm', 'g', CURRENT_TIMESTAMP),
  ('I017', 'Cam tươi/cam vàng', 'g', CURRENT_TIMESTAMP),
  ('I018', 'Bột Matcha', 'g', CURRENT_TIMESTAMP),
  ('I019', 'Kem béo thực vật', 'ml', CURRENT_TIMESTAMP),
  ('I020', 'Whipping cream', 'ml', CURRENT_TIMESTAMP),
  ('I021', 'Muối', 'g', CURRENT_TIMESTAMP),
  ('I022', 'Syrup cam', 'ml', CURRENT_TIMESTAMP);

INSERT INTO "ProductIngredient" ("productId", "ingredientId", "quantity", "isOptional")
SELECT p."id", i."id", recipe."quantity", recipe."isOptional"
FROM (VALUES
  ('Cappuccino', 'I002', 30, false),
  ('Cappuccino', 'I004', 120, false),
  ('Cappuccino', 'I011', 2, false),
  ('Cappuccino', 'I006', 5, true),
  ('Cà phê Phin', 'I001', 25, false),
  ('Cà phê Phin', 'I008', 100, false),
  ('Cà phê Phin', 'I006', 10, true),
  ('Cà phê Phin', 'I010', 150, false),
  ('Bạc Xỉu Sài Gòn', 'I002', 30, false),
  ('Bạc Xỉu Sài Gòn', 'I004', 100, false),
  ('Bạc Xỉu Sài Gòn', 'I005', 30, false),
  ('Bạc Xỉu Sài Gòn', 'I010', 150, false),
  ('Cà phê Đen Đá', 'I002', 40, false),
  ('Cà phê Đen Đá', 'I009', 20, false),
  ('Cà phê Đen Đá', 'I006', 10, true),
  ('Cà phê Đen Đá', 'I010', 150, false),
  ('Trà Đào Cam Sả', 'I012', 120, false),
  ('Trà Đào Cam Sả', 'I013', 20, false),
  ('Trà Đào Cam Sả', 'I007', 15, false),
  ('Trà Đào Cam Sả', 'I014', 30, false),
  ('Trà Đào Cam Sả', 'I015', 10, false),
  ('Trà Đào Cam Sả', 'I016', 40, false),
  ('Trà Đào Cam Sả', 'I017', 20, false),
  ('Trà Đào Cam Sả', 'I010', 150, false),
  ('Matcha Latte', 'I018', 5, false),
  ('Matcha Latte', 'I008', 40, false),
  ('Matcha Latte', 'I004', 120, false),
  ('Matcha Latte', 'I005', 15, false),
  ('Matcha Latte', 'I006', 5, false),
  ('Matcha Latte', 'I010', 150, false),
  ('Cà Phê Muối BrewLite', 'I002', 40, false),
  ('Cà Phê Muối BrewLite', 'I005', 25, false),
  ('Cà Phê Muối BrewLite', 'I019', 30, false),
  ('Cà Phê Muối BrewLite', 'I020', 30, false),
  ('Cà Phê Muối BrewLite', 'I021', 1, false),
  ('Cà Phê Muối BrewLite', 'I004', 10, false),
  ('Cà Phê Muối BrewLite', 'I010', 150, false),
  ('Cold Brew Cam Vàng BrewLite', 'I003', 80, false),
  ('Cold Brew Cam Vàng BrewLite', 'I014', 60, false),
  ('Cold Brew Cam Vàng BrewLite', 'I022', 15, false),
  ('Cold Brew Cam Vàng BrewLite', 'I009', 30, false),
  ('Cold Brew Cam Vàng BrewLite', 'I017', 30, false),
  ('Cold Brew Cam Vàng BrewLite', 'I010', 150, false)
) AS recipe("productName", "ingredientCode", "quantity", "isOptional")
JOIN "Product" p ON p."name" = recipe."productName"
JOIN "Ingredient" i ON i."code" = recipe."ingredientCode"
ON CONFLICT ("productId", "ingredientId") DO NOTHING;