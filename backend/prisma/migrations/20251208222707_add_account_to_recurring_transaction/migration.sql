-- AlterTable
ALTER TABLE "RecurringTransaction" ADD COLUMN "accountId" TEXT;

-- Update existing rows with a default account ID
UPDATE "RecurringTransaction" SET "accountId" = 'a406fbf8-490e-471c-bf81-734ce011df20' WHERE "accountId" IS NULL;

-- Alter column to be NOT NULL
ALTER TABLE "RecurringTransaction" ALTER COLUMN "accountId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
