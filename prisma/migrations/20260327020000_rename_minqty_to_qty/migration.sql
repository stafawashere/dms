-- DropIndex
DROP INDEX IF EXISTS "PriceTier_productId_minQty_key";

-- RenameColumn
ALTER TABLE "PriceTier" RENAME COLUMN "minQty" TO "qty";

-- CreateIndex
CREATE UNIQUE INDEX "PriceTier_productId_qty_key" ON "PriceTier"("productId", "qty");
