-- DropForeignKey
ALTER TABLE "Expert" DROP CONSTRAINT "Expert_ownerId_fkey";

-- AlterTable
ALTER TABLE "Expert" ALTER COLUMN "ownerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Expert" ADD CONSTRAINT "Expert_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
