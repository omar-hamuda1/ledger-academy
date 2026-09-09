-- AlterTable
ALTER TABLE "User" ADD COLUMN     "guardianConsentAt" TIMESTAMP(3),
ADD COLUMN     "guardianContact" TEXT,
ADD COLUMN     "guardianName" TEXT;
