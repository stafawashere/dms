-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "unit" TEXT;

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "costPrice" DECIMAL(65,30) NOT NULL,
    "sellPrice" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceTier_productId_minQty_key" ON "PriceTier"("productId", "minQty");

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
