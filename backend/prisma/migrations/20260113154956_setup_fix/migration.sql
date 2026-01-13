/*
  Warnings:

  - You are about to drop the column `scope` on the `UserOAuth` table. All the data in the column will be lost.
  - You are about to drop the `Investment` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('REAL_ESTATE', 'VEHICLE', 'STOCK', 'CRYPTO', 'BOND', 'FUND', 'ETF', 'CASH', 'COLLECTIBLE', 'OTHER');

-- AlterEnum
ALTER TYPE "AccountType" ADD VALUE 'SAVINGS';

-- DropForeignKey
ALTER TABLE "AccountSnapshot" DROP CONSTRAINT "AccountSnapshot_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Investment" DROP CONSTRAINT "Investment_userId_fkey";

-- DropIndex
DROP INDEX "AuditLog_entityType_entityId_idx";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'MXN',
ADD COLUMN     "includeInNetWorth" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" "AccountType" NOT NULL;

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "notifyThreshold" INTEGER;

-- AlterTable
ALTER TABLE "InstallmentPurchase" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "interestRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "financialScore" INTEGER DEFAULT 0,
ADD COLUMN     "netWorth" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "currency" SET DEFAULT 'MXN',
ALTER COLUMN "monthlyNetIncome" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "UserOAuth" DROP COLUMN "scope";

-- DropTable
DROP TABLE "Investment";

-- DropEnum
DROP TYPE "InvestmentType";

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "ticker" TEXT,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "isLiquid" BOOLEAN NOT NULL DEFAULT false,
    "includeInNetWorth" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetSnapshot" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asset_userId_type_idx" ON "Asset"("userId", "type");

-- CreateIndex
CREATE INDEX "AssetSnapshot_assetId_date_idx" ON "AssetSnapshot"("assetId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AssetSnapshot_assetId_date_key" ON "AssetSnapshot"("assetId", "date");

-- CreateIndex
CREATE INDEX "Transaction_userId_date_idx" ON "Transaction"("userId", "date");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSnapshot" ADD CONSTRAINT "AccountSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetSnapshot" ADD CONSTRAINT "AssetSnapshot_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
