-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "destination_account_id" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_destination_account_id_fkey" FOREIGN KEY ("destination_account_id") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
