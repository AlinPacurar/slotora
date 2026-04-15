-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "notifyOnVote" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true;
