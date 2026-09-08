-- CreateEnum
CREATE TYPE "NotificationAudience" AS ENUM ('CURRENT_STUDENTS', 'ALL_STUDENTS');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "audience" "NotificationAudience" NOT NULL DEFAULT 'CURRENT_STUDENTS';
