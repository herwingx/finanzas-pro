-- AlterTable
ALTER TABLE "InstallmentPurchase" ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidInstallments" INTEGER NOT NULL DEFAULT 0;
