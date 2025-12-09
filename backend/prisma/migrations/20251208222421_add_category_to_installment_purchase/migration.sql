-- AlterTable
ALTER TABLE "InstallmentPurchase" ADD COLUMN "categoryId" TEXT;

-- Update existing rows with a default category ID
UPDATE "InstallmentPurchase" SET "categoryId" = '4e60f2b8-abed-41f9-b905-6ab9034b23e6' WHERE "categoryId" IS NULL;

-- Alter column to be NOT NULL
ALTER TABLE "InstallmentPurchase" ALTER COLUMN "categoryId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "InstallmentPurchase" ADD CONSTRAINT "InstallmentPurchase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
