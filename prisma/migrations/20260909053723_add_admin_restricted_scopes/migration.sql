-- AlterTable
ALTER TABLE "User" ADD COLUMN     "restrictedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
